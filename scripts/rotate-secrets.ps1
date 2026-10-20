[CmdletBinding()]
param(
  [string]$Role = 'app_gestor'
)

$ErrorActionPreference = 'Stop'

if ($Role -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') {
  throw "Nome de papel inválido: $Role"
}

function New-Secret {
  param([int]$Bytes)
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $buffer = New-Object byte[] $Bytes
    $rng.GetBytes($buffer)
    return [Convert]::ToBase64String($buffer)
  } finally {
    $rng.Dispose()
  }
}

function New-UrlSafeSecret {
  param([int]$Bytes)
  return (New-Secret -Bytes $Bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

$betterAuthSecret = New-Secret -Bytes 32
$appRolePassword = New-UrlSafeSecret -Bytes 32
$backupEncryptionKey = New-Secret -Bytes 48
$appRoleEncoded = [Uri]::EscapeDataString($appRolePassword)
$sqlPassword = $appRolePassword.Replace("'", "''")

Write-Output 'Nao cole estes valores em issues, commits ou chats.'
Write-Output 'Guarde-os no gerenciador de segredos e limpe o historico do terminal.'
Write-Output ''
Write-Output 'BETTER_AUTH_SECRET='
Write-Output $betterAuthSecret
Write-Output ''
Write-Output "$Role password:"
Write-Output $appRolePassword
Write-Output ''
Write-Output 'Senha URL-encoded para APP_DATABASE_URL:'
Write-Output $appRoleEncoded
Write-Output ''
Write-Output 'BACKUP_ENCRYPTION_KEY:'
Write-Output $backupEncryptionKey
Write-Output ''
Write-Output 'SQL para o owner do Neon:'
Write-Output "ALTER ROLE $Role WITH PASSWORD '$sqlPassword';"
