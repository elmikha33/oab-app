# Missão OAB – Setup Rápido

1. **Pré‑requisitos**
   ```bash
   volta install node@20  # ou nvm use 20
   pnpm i -g pnpm
   ```

2. **Instalação**
   ```bash
   pnpm i
   cp .env.example .env.local   # preencha suas chaves
   ```

3. **Rodando**
   ```bash
   pnpm dev        # ambiente de desenvolvimento
   pnpm build      # build de produção
   pnpm start      # servidor local
   ```
