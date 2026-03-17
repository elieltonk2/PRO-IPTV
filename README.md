# Pro IPTV Stream - Documentação de Instalação

Esta plataforma é um sistema IPTV completo com Painel Administrativo e Aplicativo Web responsivo.

## Tecnologias Utilizadas
- **Frontend**: React 19, Tailwind CSS 4, Lucide-React, Motion.
- **Backend**: Node.js, Express.
- **Banco de Dados & Auth**: Firebase (Firestore & Auth).
- **Hospedagem Recomendada**: VPS Linux (Ubuntu 22.04+).

## Requisitos do Servidor
- Node.js 20 ou superior.
- NPM ou Yarn.
- PM2 (para manter o processo rodando).

## Instruções de Instalação na VPS

1. **Clone o repositório ou envie os arquivos para a VPS.**
2. **Instale as dependências:**
   ```bash
   npm install
   ```
3. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto com as chaves do seu Firebase (veja o arquivo `firebase-applet-config.json` gerado).
4. **Build do Projeto:**
   ```bash
   npm run build
   ```
5. **Inicie o Servidor com PM2:**
   ```bash
   pm2 start server.ts --interpreter tsx --name "pro-iptv"
   ```
6. **Configuração de Proxy Reverso (Nginx):**
   Configure o Nginx para apontar para a porta 3000 da sua VPS.

## Acesso Inicial
- **App**: Acesse a URL principal.
- **Admin**: Faça login com o email `elieltonsilvak2@gmail.com` (configurado como administrador padrão nas Security Rules).
- **Primeiros Passos**: No Painel Admin, crie as categorias primeiro, depois adicione os canais, filmes e séries.

## Segurança
As Security Rules do Firestore já estão configuradas para:
- Bloquear usuários banidos.
- Permitir apenas administradores gerenciarem conteúdo.
- Proteger dados de PII (email, etc).
- Validar formatos de URL e tipos de dados.

---
Desenvolvido com Google AI Studio.
