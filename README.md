# Concurso Público

Sistema completo de gerenciamento de concursos públicos desenvolvido com Next.js 14, TypeScript e Supabase. Permite aos usuários visualizar, filtrar e favoritar procedimentos de concursos públicos, além de seguir entidades específicas.

## 🚀 Funcionalidades

- ✅ **Sistema de Autenticação** - Login e cadastro com Supabase
- ✅ **Listagem de Concursos** - Visualização de procedimentos ativos e expirados
- ✅ **Sistema de Favoritos** - Marcar e gerenciar concursos favoritos
- ✅ **Filtros Personalizados** - Criar e aplicar filtros customizados
- ✅ **Seguir Entidades** - Acompanhar procedimentos de entidades específicas
- ✅ **Pesquisa NIPC** - Validação automática via API VIES
- ✅ **Interface Responsiva** - Design moderno e adaptável
- ✅ **Dashboard Completo** - Estatísticas e ações rápidas

## 🛠️ Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** -
- **Tailwind CSS** - Estilização
- **Supabase** - Backend e autenticação (preparado)

## 📦 Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp env.example .env.local
   ```
   
   Preencha o arquivo `.env.local` com suas credenciais do Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
   ```

   **Como obter as credenciais do Supabase:**
   1. Acesse [supabase.com](https://supabase.com)
   2. Crie uma conta ou faça login
   3. Crie um novo projeto
   4. Vá em Settings > API
   5. Copie a URL do projeto e a chave anônima (anon key)

4. Execute o projeto:
   ```bash
   npm run dev
   ```

5. Acesse [http://localhost:3000](http://localhost:3000)

## 🔐 Autenticação e Funcionalidades

### **Sistema de Autenticação**
- ✅ Login e cadastro com Supabase Auth
- ✅ Persistência de sessão e logout seguro
- ✅ Interface personalizada por tipo de usuário

### **Gestão de Concursos**
- ✅ Listagem completa de procedimentos
- ✅ Filtros por status (Ativos/Expirados)
- ✅ Sistema de busca por texto
- ✅ Detalhes expandíveis de cada concurso
- ✅ Cálculo automático de tempo restante

### **Sistema de Favoritos**
- ✅ Marcar/desmarcar concursos como favoritos
- ✅ Página dedicada de favoritos
- ✅ Contador de favoritos ativos na topbar
- ✅ Persistência no banco de dados

### **Filtros Personalizados**
- ✅ Criação de filtros customizados
- ✅ Seleção por distrito e municípios
- ✅ Filtros por palavras-chave
- ✅ Edição e exclusão de filtros
- ✅ Aplicação automática de filtros

### **Seguir Entidades**
- ✅ Lista de entidades disponíveis
- ✅ Pesquisa NIPC via API VIES
- ✅ Validação automática de entidades
- ✅ Contador de procedimentos ativos por entidade
- ✅ Página dedicada por entidade

### **Dashboard**
- ✅ Estatísticas gerais
- ✅ Ações rápidas
- ✅ Gestão de entidades seguidas
- ✅ Notificações customizadas

## 📁 Estrutura do Projeto

```
├── app/
│   ├── globals.css              # Estilos globais
│   ├── layout.tsx               # Layout principal
│   ├── page.tsx                 # Página inicial (Procedimentos)
│   ├── login/
│   │   └── page.tsx             # Página de login
│   ├── signup/
│   │   └── page.tsx             # Página de cadastro
│   ├── favoritos/
│   │   └── page.tsx             # Página de favoritos
│   ├── dashboard/
│   │   └── page.tsx             # Dashboard do usuário
│   ├── entidade/
│   │   └── [nipc]/
│   │       └── page.tsx         # Página de procedimentos por entidade
│   ├── api/
│   │   └── vies/
│   │       └── route.ts         # API route para consulta VIES
│   └── components/
│       └── Notification.tsx     # Componente de notificações
├── lib/
│   └── supabase.ts              # Configuração do Supabase
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── next.config.js
├── vercel.json                  # Configurações do Vercel
└── README.md
```

## 🎨 Interface

O sistema possui uma interface moderna e responsiva com:
- Design limpo e profissional
- Cores consistentes com tema azul
- Formulários com validação
- Feedback visual para ações do usuário
- Layout responsivo para mobile e desktop

## 🚀 Deploy no Vercel

A aplicação está otimizada para deploy no Vercel:

1. **Conecte o repositório** ao Vercel
2. **Configure as variáveis de ambiente**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy automático** será iniciado

### **Configuração do Supabase**

Certifique-se de ter as seguintes tabelas no Supabase:
- `Concursos` - Dados dos procedimentos
- `Municipios` - Lista de distritos e municípios
- `Concurso_Filtros` - Filtros personalizados dos usuários
- `Users_Settings` - Configurações e favoritos dos usuários
- `Entidades` - Entidades disponíveis para seguir

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📞 Suporte

Para dúvidas ou suporte, abra uma issue no repositório.
