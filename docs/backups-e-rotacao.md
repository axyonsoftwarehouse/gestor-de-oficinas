# Backups offsite e rotação de segredos

> Runbook operacional do Gestor de Oficinas.
> Automação preparada em 17/10/2026, depois do snapshot do mapa em `main@83ac90f`.
> Enquanto o bucket e os secrets não forem configurados, o risco permanece aberto.

## 1. O que está preparado

O Neon gratuito não oferece backup agendado. A solução preparada roda no GitHub
Actions e não depende da Vercel:

1. **Diariamente às 03:00 UTC** (00:00 em America/Sao_Paulo), ou sob demanda.
2. Conecta pela **conexão direta** do Neon (`PROD_DIRECT_URL`, porta 5432).
3. Gera um dump PostgreSQL no formato **custom** com `pg_dump` 18.
4. Confere o dump com `pg_restore --list`.
5. Cifra o arquivo com **AES-256-GCM** e chave derivada por **scrypt**.
6. Gera **SHA-256** e um **manifesto** com data, banco, versão do `pg_dump`, commit
   e fingerprint da chave (nunca a chave).
7. Envia dump, checksum e manifesto para um **bucket S3-compatível** privado
   (Cloudflare R2, Backblaze B2, AWS S3, MinIO etc.).
8. Aplica retenção: **30 dias** para backups diários e **365 dias** para o backup
   do dia 1 de cada mês.
9. Guarda uma cópia cifrada por **7 dias** como artefato do GitHub, como rede de
   segurança se o upload falhar.

Arquivos:

- `scripts/backup-db.mjs` — dump, cifra, checksum, upload e retenção.
- `scripts/restore-db.mjs` — verificação e restauração protegida.
- `scripts/lib/backup-lib.mjs` — conexão, cifra e utilidades comuns.
- `.github/workflows/backup.yml` — agendamento e execução manual.
- `scripts/rotate-secrets.ps1` — geração de segredos e SQL de rotação.

## 2. Decisões e limites

| Item            | Padrão preparado              | Observação                                                      |
| --------------- | ----------------------------- | --------------------------------------------------------------- |
| Frequência      | 1x/dia, 03:00 UTC             | RPO de até 24 h; rode manualmente antes de migrações de risco   |
| Retenção        | 30 diários + 365 mensais      | Configurável por variáveis do repositório                       |
| Storage         | Qualquer S3-compatível        | R2 é a opção de menor custo sugerida; o bucket deve ser privado |
| Cifra           | AES-256-GCM, chave via scrypt | Sem a chave, o backup é irrecuperável                           |
| Cópia no GitHub | Artefato cifrado, 7 dias      | Não substitui o bucket; é fallback                              |
| PITR            | Não                           | O dump é diário; não há point-in-time recovery                  |
| Responsável     | A definir                     | Precisa haver dono para chave, bucket e drill                   |

O backup contém dados pessoais e financeiros. Mantenha o bucket privado,
credenciais com o menor privilégio possível e a chave de cifra fora do GitHub.

## 3. Configuração inicial (uma vez)

### 3.1 Criar o bucket e as credenciais

1. Crie um bucket privado no provedor escolhido.
2. Crie uma credencial com permissão apenas de leitura/escrita nesse bucket.
   Não use credencial administrativa da conta.
3. Anote o endpoint S3, a região e o nome do bucket.
4. Se o provedor permitir, configure uma lifecycle rule para apagar objetos com
   mais de 400 dias e abortar uploads multipart incompletos. A limpeza normal é
   feita pelo script; a lifecycle é defesa adicional.

Exemplo de endpoint no Cloudflare R2:

```text
https://<account-id>.r2.cloudflarestorage.com
```

Região sugerida no R2: `auto`.

### 3.2 Gerar a chave de cifra

No Windows:

```powershell
pwsh scripts/rotate-secrets.ps1
```

Copie apenas o valor de `BACKUP_ENCRYPTION_KEY` para o gerenciador de segredos.
Não reuse os valores de autenticação gerados na mesma saída. Em Linux/macOS:

```bash
openssl rand -base64 48
```

Guarde a chave em pelo menos dois locais seguros e fora do GitHub. O manifesto
do backup registra um `keyId` (fingerprint de 12 caracteres derivado da chave por
scrypt, sem expor a chave) para indicar qual chave usar em cada arquivo.

### 3.3 Configurar secrets e variáveis no GitHub

Em **Settings → Secrets and variables → Actions**:

| Nome                            | Tipo                | Conteúdo                                                  |
| ------------------------------- | ------------------- | --------------------------------------------------------- |
| `PROD_DIRECT_URL`               | secret              | URL direta do Neon (já usada pelo workflow de migrations) |
| `BACKUP_ENCRYPTION_KEY`         | secret              | chave gerada em 3.2                                       |
| `BACKUP_S3_BUCKET`              | secret              | nome do bucket                                            |
| `BACKUP_S3_ENDPOINT`            | secret              | endpoint S3-compatível; vazio para AWS S3                 |
| `BACKUP_S3_REGION`              | secret              | `auto` no R2 ou a região do provedor                      |
| `BACKUP_S3_ACCESS_KEY_ID`       | secret              | credencial de escrita do bucket                           |
| `BACKUP_S3_SECRET_ACCESS_KEY`   | secret              | segredo da credencial                                     |
| `BACKUP_S3_PREFIX`              | variable (opcional) | prefixo das chaves; padrão `gestor-oficinas`              |
| `BACKUP_RETENTION_DAYS`         | variable (opcional) | retenção diária; padrão `30`                              |
| `BACKUP_MONTHLY_RETENTION_DAYS` | variable (opcional) | retenção mensal; padrão `365`                             |

O workflow usa `PROD_DIRECT_URL` como `BACKUP_DATABASE_URL`. Nenhuma credencial
de produção fica no código ou no `.env` do repositório. As variáveis `S3_*` do
`.env.example` são para o storage de anexos (backlog) e não são usadas pelo backup;
use `BACKUP_S3_*` e as credenciais `AWS_*` acima.

### 3.4 Primeira execução

1. Abra **Actions → Backup do banco → Run workflow**.
2. Confira no log o banco, o tamanho, o SHA-256 e o destino S3.
3. Baixe o objeto do bucket e confira o checksum:

```powershell
aws s3 cp "s3://<bucket>/gestor-oficinas/2026/10/<arquivo>.dump.enc" .backups/
pnpm db:backup:verify .backups/gestor-oficinas_....dump.enc
```

4. Faça o primeiro **drill de restauração** em uma branch do Neon (seção 6).
5. Só considere o risco mitigado depois do drill aprovado.

## 4. Backup manual

O script lê `.env` quando a variável não existe no ambiente. Para usar a conexão
direta configurada no `.env`:

```powershell
pnpm db:backup
pnpm db:backup:verify .backups/gestor-oficinas_....dump.enc
```

Para apontar para outro banco sem alterar o `.env`:

```powershell
$env:BACKUP_DATABASE_URL="postgresql://usuario:senha@host:5432/banco?sslmode=require"
$env:BACKUP_ENCRYPTION_KEY="a-chave-do-gerenciador"
pnpm db:backup
```

Para enviar e aplicar retenção manualmente:

```powershell
pnpm db:backup --upload --prune
```

O script usa `pg_dump`/`pg_restore` do `PATH`, a variável `PG_DUMP`/`PG_RESTORE`
ou o PostgreSQL portátil em `.pgtest/pgsql/bin` (disponível após
`pnpm db:test:up`). Em produção, o workflow instala o cliente 18.

## 5. Verificação de um backup

```powershell
pnpm db:backup:verify .backups/gestor-oficinas_....dump.enc
```

O comando:

1. Confere o SHA-256 contra o arquivo `.sha256`.
2. Decifra para um diretório temporário.
3. Lê o TOC com `pg_restore --list`.
4. Apaga o arquivo temporário ao final.

Um backup só é considerado válido quando o checksum confere e o TOC é legível.
Faça também um drill de restauração periodicamente; checksum e TOC não provam que
o banco restaurado responde.

## 6. Restauração

### 6.1 Cenário recomendado

Restaure primeiro em uma **branch nova do Neon** ou em um banco vazio. Nunca
sobrescreva produção sem decisão explícita e janela de manutenção.

1. Baixe o dump e o checksum do bucket:

```powershell
aws s3 cp "s3://$env:BACKUP_S3_BUCKET/gestor-oficinas/2026/10/arquivo.dump.enc" .backups/
aws s3 cp "s3://$env:BACKUP_S3_BUCKET/gestor-oficinas/2026/10/arquivo.dump.enc.sha256" .backups/
```

2. Verifique o arquivo (seção 5).
3. Crie a branch/banco de destino no Neon e copie a **conexão direta**.
4. Restaure:

```powershell
$env:BACKUP_ENCRYPTION_KEY="a-chave-correta-do-manifesto"
pnpm db:restore .backups/arquivo.dump.enc --target "postgresql://..." --yes
```

O `--clean` só deve ser usado em um banco descartável, pois remove objetos
existentes antes da restauração.

5. Em um banco novo, reaplique o papel de runtime e a RLS apontando
   `DATABASE_URL` e `DIRECT_URL` para o destino:

```powershell
pnpm --filter @gestor/database db:app-role:direct
pnpm --filter @gestor/database db:rls:direct
```

Em um projeto Neon novo, crie o papel `app_gestor` com uma senha forte antes de
rodar `db:app-role:direct`. O SQL versionado usa a senha de teste `app_gestor`
somente quando o papel ainda não existe; ele não deve ser a senha de produção.

6. Valide:

- `GET /api/health` retorna `{ "status": "ok", "db": "up" }`.
- Login com o owner funciona.
- Contagem de `customers`, `vehicles`, `job_cards`, `invoices` e `payments`
  bate com o esperado.
- Uma consulta autenticada respeita o tenant (RLS ativa).

7. Para recuperação de desastre, só depois da validação aponte a Vercel para a
   branch restaurada (`DATABASE_URL`, `APP_DATABASE_URL`, `DIRECT_URL`) e faça
   um novo deploy. Mantenha a branch antiga até o aceite.

### 6.2 Drill trimestral

- Restaurar o backup mais recente em uma branch Neon descartável.
- Cronometrar do download até o `/api/health` verde (RTO medido).
- Registrar data, tamanho, tempo e problemas encontrados.
- Destruir a branch ao final.

## 7. Rotação de segredos

Regras gerais: rotacione um segredo por vez, atualize todos os consumidores,
valide, e só então revogue o valor antigo. Nunca coloque valores reais em issues,
commits, prints ou mensagens.

### 7.1 Senha do papel `app_gestor`

Usada em `APP_DATABASE_URL` no runtime da Vercel.

1. Gere a senha e o SQL:

```powershell
pwsh scripts/rotate-secrets.ps1 -Role app_gestor
```

2. Com a conexão do owner, execute:

```sql
ALTER ROLE app_gestor WITH PASSWORD '<nova-senha>';
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename = 'app_gestor' AND pid <> pg_backend_pid();
```

3. Atualize `APP_DATABASE_URL` na Vercel usando a senha URL-encoded fornecida
   pelo script. Ela fica no formato
   `postgresql://app_gestor:<senha>@<host>-pooler.../neondb?...`.
4. Faça um novo deploy e valide login, `/api/health` e uma consulta autenticada.
5. A senha antiga deixa de funcionar no `ALTER ROLE`; não é preciso revogar nada
   além de garantir que nenhum consumidor antigo ainda a use.

Esse procedimento não invalida sessões de usuários.

### 7.2 Senha do owner do Neon

Usada por migrations, `DIRECT_URL`, `DATABASE_URL` e pelo backup
(`PROD_DIRECT_URL`). O owner tem `BYPASSRLS`; nunca o use no runtime.

1. Redefina a senha do owner no console do Neon.
2. Atualize `DIRECT_URL` e `DATABASE_URL` na Vercel.
3. Atualize o secret `PROD_DIRECT_URL` no GitHub.
4. Rode o workflow **Migrate** ou um `db:deploy:direct` controlado para validar.
5. Rode o workflow **Backup do banco** manualmente.
6. Faça deploy da Vercel e valide o `/api/health`.

Enquanto os consumidores não forem atualizados, migrations e backups falham.

### 7.3 `BETTER_AUTH_SECRET`

Usado pelo Better Auth para assinar cookies de sessão.

1. Gere o valor com `pwsh scripts/rotate-secrets.ps1`.
2. Atualize `BETTER_AUTH_SECRET` na Vercel.
3. Faça deploy.
4. **Todas as sessões existentes são invalidadas**; avise os usuários e faça a
   troca em janela de manutenção.
5. Valide login novo e logout.

Se o segredo não circulou, essa rotação pode ser feita depois das prioridades
operacionais, mas deve entrar no calendário anual.

### 7.4 `BACKUP_ENCRYPTION_KEY`

1. Gere uma chave nova e guarde-a no gerenciador de segredos.
2. Atualize o secret `BACKUP_ENCRYPTION_KEY` no GitHub.
3. Rode um backup manual e confirme o novo `keyId` no manifesto.
4. Mantenha a chave antiga disponível até o último backup cifrado com ela sair da
   retenção (até 365 dias), senão backups antigos ficam irrecuperáveis.

### 7.5 Credenciais do bucket

1. Crie uma credencial nova com o mesmo escopo mínimo.
2. Atualize `BACKUP_S3_ACCESS_KEY_ID` e `BACKUP_S3_SECRET_ACCESS_KEY`.
3. Rode um backup manual e confirme o upload.
4. Revogue a credencial antiga no provedor.

## 8. Falhas e monitoramento

- Se um secret obrigatório faltar, o workflow falha com mensagem clara.
- O GitHub envia e-mail aos administradores quando um workflow agendado falha.
- Workflows agendados podem ser desativados após longos períodos sem atividade
  no repositório; confira a aba Actions mensalmente.
- Monitore o espaço e a lifecycle do bucket. A retenção normal remove objetos
  antigos, mas a lifecycle é a proteção contra falha do workflow.
- Se a chave de cifra for perdida, os backups existentes não podem ser
  recuperados. A guarda da chave é parte do backup.
- Se `pg_dump` falhar por versão do servidor, use um cliente igual ou mais novo
  que o PostgreSQL do Neon. O workflow fixa o cliente 18.

## 9. Pendências para encerrar o risco

| Pendência                                | Dono            | Critério de conclusão                                      |
| ---------------------------------------- | --------------- | ---------------------------------------------------------- |
| Escolher o provedor do bucket            | Werner/produto  | Bucket privado criado e credencial mínima emitida          |
| Configurar os secrets do GitHub          | Werner/operação | Workflow manual verde e objeto no bucket                   |
| Guardar a chave de cifra em escrow       | Werner/operação | Duas cópias seguras, uma fora do GitHub                    |
| Executar o primeiro drill de restauração | Werner/operação | Restauração em branch Neon validada com login e health     |
| Definir alerta de falha                  | Werner/operação | Responsável e canal definidos; e-mail do GitHub confirmado |
| Rotacionar owner/app role                | Werner/operação | Senhas antigas invalidadas e consumidores atualizados      |

Até esses itens estarem concluídos, a entrada de backup e rotação de segredos
continua aberta no Caderno do Projeto.
