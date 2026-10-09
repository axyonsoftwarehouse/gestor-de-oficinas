# =============================================================================
# PostgreSQL portable para TESTES (substitui o Docker).
# -----------------------------------------------------------------------------
# Baixa os binarios oficiais do PostgreSQL (EDB) uma unica vez, cria um cluster
# local em .pgtest\data e sobe o servidor na porta 5434. Nada de Docker, nada de
# admin e nada de servico permanente: quando voce da `stop`, nao fica nada
# rodando em segundo plano.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/pg-test.ps1 start
#   powershell -ExecutionPolicy Bypass -File scripts/pg-test.ps1 stop
#   powershell -ExecutionPolicy Bypass -File scripts/pg-test.ps1 status
#   powershell -ExecutionPolicy Bypass -File scripts/pg-test.ps1 reset   # recria o cluster
#   powershell -ExecutionPolicy Bypass -File scripts/pg-test.ps1 destroy # apaga binarios+data
#
# Ou pelos atalhos: pnpm db:test:up | db:test:down | db:test:status
# =============================================================================

param(
  [Parameter(Position = 0)]
  [ValidateSet('init', 'start', 'stop', 'status', 'reset', 'destroy')]
  [string]$Action = 'start'
)

$ErrorActionPreference = 'Continue'

$Root      = Split-Path -Parent $PSScriptRoot
$Base      = Join-Path $Root '.pgtest'
$PgDir     = Join-Path $Base 'pgsql'
$DataDir   = Join-Path $Base 'data'
$LogFile   = Join-Path $Base 'postgres.log'
$ZipFile   = Join-Path $Base 'postgresql-binaries.zip'
$Port      = 5434
$DbName    = 'gestor_test'
$SuperUser = 'postgres'
$PgVersion = '16.10-1'
$PgUrl     = "https://get.enterprisedb.com/postgresql/postgresql-$PgVersion-windows-x64-binaries.zip"

$PgCtl    = Join-Path $PgDir 'bin\pg_ctl.exe'
$InitDb   = Join-Path $PgDir 'bin\initdb.exe'
$Psql     = Join-Path $PgDir 'bin\psql.exe'
$Createdb = Join-Path $PgDir 'bin\createdb.exe'

function Write-Info($message) { Write-Host "[pg-test] $message" -ForegroundColor Cyan }
function Write-Fail($message) { Write-Host "[pg-test] $message" -ForegroundColor Red }

function Ensure-Binaries {
  if (Test-Path -LiteralPath $PgCtl) { return }
  New-Item -ItemType Directory -Force -Path $Base | Out-Null

  if (-not (Test-Path -LiteralPath $ZipFile)) {
    Write-Info "Baixando PostgreSQL $PgVersion (~300MB, apenas na primeira vez)..."
    $previous = $ProgressPreference
    $ProgressPreference = 'SilentlyContinue'
    try {
      Invoke-WebRequest -Uri $PgUrl -OutFile $ZipFile -UseBasicParsing
    } catch {
      $ProgressPreference = $previous
      Write-Fail "Falha no download: $($_.Exception.Message)"
      exit 1
    }
    $ProgressPreference = $previous
  }

  Write-Info 'Extraindo binarios...'
  try {
    Expand-Archive -LiteralPath $ZipFile -DestinationPath $Base -Force
  } catch {
    Write-Fail "Falha ao extrair: $($_.Exception.Message)"
    exit 1
  }
  Remove-Item -LiteralPath $ZipFile -Force -ErrorAction SilentlyContinue

  if (-not (Test-Path -LiteralPath $PgCtl)) {
    Write-Fail 'pg_ctl.exe nao encontrado apos a extracao.'
    exit 1
  }
}

function Test-Running {
  if (-not (Test-Path -LiteralPath $PgCtl)) { return $false }
  & $PgCtl -D $DataDir status *> $null
  return ($LASTEXITCODE -eq 0)
}

function Ensure-Data {
  if (Test-Path -LiteralPath (Join-Path $DataDir 'PG_VERSION')) { return }
  Write-Info "Inicializando cluster em .pgtest\data ..."
  New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
  & $InitDb -D $DataDir -U $SuperUser -A trust -E UTF8 --locale=C | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Fail "initdb falhou (codigo $LASTEXITCODE)."
    exit 1
  }
}

function Ensure-Database {
  $exists = & $Psql -h localhost -p $Port -U $SuperUser -d postgres -tAc "select 1 from pg_database where datname = '$DbName'"
  if ("$exists".Trim() -ne '1') {
    & $Createdb -h localhost -p $Port -U $SuperUser $DbName | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-Fail "Nao foi possivel criar o banco $DbName."
      exit 1
    }
    Write-Info "Banco $DbName criado."
  }
}

function Start-Pg {
  Ensure-Binaries
  Ensure-Data
  if (Test-Running) {
    Write-Info "Ja esta rodando. postgresql://${SuperUser}@localhost:$Port/$DbName"
    return
  }
  Write-Info "Iniciando PostgreSQL na porta $Port ..."
  # Inicia numa janela separada (oculta) para o servidor NAO herdar o stdout
  # desta sessao. IMPORTANTE: sem -Wait (o -Wait do PowerShell esperaria o
  # proprio postgres, que nunca termina). Depois aguardamos via pg_ctl status.
  $argLine = "-D `"$DataDir`" -l `"$LogFile`" -o `"-p $Port`" -w start"
  Start-Process -FilePath $PgCtl -ArgumentList $argLine -WindowStyle Hidden | Out-Null

  $deadline = (Get-Date).AddSeconds(30)
  while (-not (Test-Running) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 500
  }
  if (-not (Test-Running)) {
    Write-Fail 'Nao foi possivel iniciar. Veja .pgtest\postgres.log'
    exit 1
  }
  Ensure-Database
  Write-Info "Pronto. TEST_DATABASE_URL = postgresql://${SuperUser}@localhost:$Port/$DbName"
}

function Stop-Pg {
  if (-not (Test-Running)) {
    Write-Info 'Nao esta rodando.'
    return
  }
  Write-Info 'Parando PostgreSQL ...'
  & $PgCtl -D $DataDir -m fast -w stop | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Fail "Falha ao parar (codigo $LASTEXITCODE)."
    exit 1
  }
  Write-Info 'Parado.'
}

function Show-Status {
  if (Test-Running) {
    Write-Info "Rodando na porta $Port. postgresql://${SuperUser}@localhost:$Port/$DbName"
  } else {
    Write-Info 'Parado.'
  }
}

function Reset-Pg {
  Stop-Pg
  if (Test-Path -LiteralPath $DataDir) {
    Remove-Item -LiteralPath $DataDir -Recurse -Force
  }
  Write-Info 'Cluster removido.'
  Start-Pg
}

function Destroy-Pg {
  Stop-Pg
  if (Test-Path -LiteralPath $Base) {
    Remove-Item -LiteralPath $Base -Recurse -Force
  }
  Write-Info '.pgtest removido (binarios e dados).'
}

switch ($Action) {
  'init'    { Ensure-Binaries; Ensure-Data; Write-Info 'Cluster pronto (nao iniciado).' }
  'start'   { Start-Pg }
  'stop'    { Stop-Pg }
  'status'  { Show-Status }
  'reset'   { Reset-Pg }
  'destroy' { Destroy-Pg }
}
