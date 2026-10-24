# Universal Music Distributor

Ola Quero Criar uma Destribuidora de musica para todas as plataformas digitais

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/60013c5c-7360-4171-9c58-798551da67c2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Configuração para execução

O projeto usa Supabase Auth, PostgreSQL, Storage privado e políticas RLS. Em Replit,
adicione estes nomes em **Secrets** (não cole valores de chaves no código):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `LOVABLE_DB_MIGRATION_URL` (necessário apenas para aplicar migrações)

As quatro primeiras variáveis são a URL do projeto e a chave publicável Supabase; a
chave publicável é desenhada para uso no browser. Nunca use uma `service_role` ou chave
secreta numa variável `VITE_*`. A aplicação não precisa da chave `service_role`.
Consulte `.env.example` para o formato, sem credenciais reais.

Com o ambiente configurado, aplique as migrações aditivas na base Supabase correta:

```sh
npm run db:migrate
```

O utilizador de migração deve ter permissões para criar tabelas, funções, políticas e
buckets no projeto. A atribuição do primeiro administrador é uma operação manual do
responsável autenticado na consola SQL do Supabase; não existe botão de auto-promoção
na aplicação. Use o ID do utilizador confirmado:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where email = 'EMAIL_DO_ADMIN_CONFIRMADO'
on conflict (user_id, role) do nothing;
```

A revisão e a aprovação no painel são internas. A distribuição efetiva, a recolha de
relatórios de royalties a partir de DSPs e os pedidos de remoção externos exigem um
contrato e uma integração com distribuidor autorizado, ainda não configurados.

Antes de aceitar artistas, configure os URLs de confirmação/recuperação e o fornecedor
OAuth (se utilizado) nas definições de Auth do Supabase. Revise e aprove legalmente os
documentos marcados como rascunho antes de os publicar como políticas vigentes.
