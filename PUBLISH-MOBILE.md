# 📱 Publicação nas lojas — Mapa de Vendas

Este guia leva o app do Lovable até a App Store e a Google Play como **atualização** da versão já existente.

---

## ⚠️ Antes de tudo — IDs do app já publicado

Para a Apple/Google reconhecerem como **atualização** (e não app novo), o **Bundle ID (iOS)** e o **Application ID (Android)** precisam ser **idênticos** aos do app que já está no ar.

1. **Apple — Bundle ID**
   App Store Connect → seu app → Geral → Informações do App → "Bundle ID".
   Formato: `com.suaempresa.mapadevendas`.

2. **Google — Application ID**
   Google Play Console → seu app → Painel → no topo aparece o "Nome do pacote".
   Formato: `com.suaempresa.mapadevendas`.

3. Edite `capacitor.config.ts` e troque o valor de `appId` pelo ID real.
   *Apple e Google usam o mesmo `appId` do Capacitor.*

> ❌ Se o `appId` não bater, a loja recusa ("já existe app com esse ID") ou cria um app novo separado do que já está publicado.

---

## 🚀 Passo a passo (faça no seu computador)

> Lovable já fez toda a configuração de código. Os comandos abaixo rodam **na sua máquina**, depois de exportar o projeto para o GitHub.

### 1. Exportar o projeto
- No Lovable, clique em **GitHub → Connect to GitHub** (se ainda não fez).
- Faça `git clone` do repositório para sua máquina.

### 2. Instalar dependências
```bash
npm install
```

### 3. Trocar o appId (uma única vez)
Edite `capacitor.config.ts` e coloque o Bundle ID/Application ID exato da sua versão já publicada.

### 4. Remover hot-reload do bloco `server`
Antes da build de produção, **apague o bloco `server`** do `capacitor.config.ts`. Ele só serve para desenvolvimento.

### 5. Adicionar plataformas nativas
```bash
npx cap add ios
npx cap add android
```

### 6. Buildar o front e sincronizar
```bash
npm run build
npx cap sync
```

### 7. Subir o `versionCode` / `Build number`
Como é uma **atualização**, a loja exige número de versão maior que o publicado.

- **iOS** (`ios/App/App.xcodeproj` no Xcode):
  - **Version** (CFBundleShortVersionString): incremente, ex.: `1.1.0`
  - **Build** (CFBundleVersion): incremente, ex.: `2`

- **Android** (`android/app/build.gradle`):
  - `versionName "1.1.0"`
  - `versionCode` deve ser **maior** que o atual no Play Console (ex.: `2`).

### 8. Abrir o projeto nativo
```bash
npx cap open ios       # abre no Xcode (precisa de Mac)
npx cap open android   # abre no Android Studio
```

### 9. Configurar assinatura

#### iOS
- Xcode → projeto **App** → Signing & Capabilities → selecione seu **Team** (Apple Developer).
- Confirme que o **Bundle Identifier** está igual ao do app publicado.
- Product → **Archive** → Distribute App → App Store Connect → Upload.

#### Android
Use a **mesma keystore** (`.jks`) usada na publicação anterior. **Sem ela**, o Google não aceita a atualização.

- Se você já usa **Play App Signing** (recomendado pelo Google), basta gerar um **App Bundle (.aab)** assinado com sua "upload key".
- Build → Generate Signed Bundle/APK → escolha **Android App Bundle** → faça upload no Play Console.

### 10. Enviar para revisão
- **App Store Connect**: TestFlight → adicione build → preencha "What's New" → enviar para revisão.
- **Play Console**: Produção → criar versão → upload do `.aab` → notas da versão → enviar para análise.

---

## 📋 Dados da loja já preenchidos no app

| Campo | Valor configurado |
|---|---|
| Nome do app | Mapa de Vendas |
| Idioma principal | Português (pt-BR) |
| Cor da splash / status bar | `#0F0F0F` |
| Cor primária | Vinho HSL `348 70% 35%` |
| Ícone (1024×1024) | `public/apple-touch-icon.png` |
| Splash screen | `public/splash.png` |
| Categoria sugerida | Negócios / Produtividade |
| Classificação | Livre (4+) |

---

## 🖼️ Assets que você ainda precisa preparar para a loja

A loja **não puxa** as imagens automaticamente — você anexa direto no Connect/Console:

- **App Store Connect**
  - Screenshots iPhone 6.7" (1290×2796) — mínimo 3
  - Screenshots iPhone 6.5" (1284×2778) — mínimo 3
  - Ícone 1024×1024 (use `public/apple-touch-icon.png`)
  - Descrição, palavras-chave, URL de suporte, URL de privacidade

- **Google Play Console**
  - Ícone 512×512
  - Banner gráfico de destaque 1024×500
  - Screenshots celular — mínimo 2
  - Descrição curta (80 chars) e completa (4000 chars)
  - Política de privacidade (URL pública obrigatória)

---

## 🔐 Permissões já declaradas

O app **não usa** câmera, GPS, notificações nem microfone — então nenhuma permissão extra precisa ser justificada na revisão. Se um dia adicionar (ex.: notificações push), atualize aqui e nas configurações da loja.

---

## ❓ Dúvidas comuns

- **Posso publicar do próprio Lovable?** Não. Lovable publica a versão **web** (PWA). Para as lojas é obrigatório passar pelo Capacitor + Xcode/Android Studio na sua máquina.
- **Os usuários atuais perdem dados?** Não. O backend (Lovable Cloud) é o mesmo — login, treinamentos e configurações continuam.
- **Preciso refazer o login dos usuários?** Não, desde que o `appId` seja mantido.