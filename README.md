import os

readme_content = """# 🚗 Vehicle Care & Cost Tracker (VCC)

Sistema full-stack avançado para gestão de manutenções veiculares, controle de custos operacionais e alertas preventivos inteligentes.

## 🛠️ Stack Tecnológica

* **Frontend:** [Next.js 14/15](https://nextjs.org/) (App Router)
* **UI Library:** [Mantine UI](https://mantine.dev/) (Componentes, Hooks e Notificações)
* **Backend & ORM:** [Node.js](https://nodejs.org/) + [Prisma](https://www.prisma.io/)
* **Camada de Acesso (Policy Engine):** [ZenStack](https://zenstack.dev/) (Segurança baseada em Schema)
* **Autenticação:** [BetterAuth](https://www.better-auth.com/) com integração **Google (Gmail)**
* **Banco de Dados & Storage:** [Supabase](https://supabase.com/) (PostgreSQL + S3 Bucket para notas fiscais)

---

## 🚀 Configuração Inicial

Para executar este projeto localmente, você precisará configurar suas variáveis de ambiente. Crie um arquivo `.env` na raiz do projeto e adicione as seguintes chaves, preenchendo com suas credenciais:

```bash
# Prisma / Supabase DB
DATABASE_URL="URL_DE_CONEXAO_POSTGRESQL_DO_SUPABASE"

# Supabase Storage
SUPABASE_URL="URL_DO_SEU_PROJETO_SUPABASE"
SUPABASE_ANON_KEY="CHAVE_ANON_DO_SUPABASE"

# Autenticação (BetterAuth / Google)
GOOGLE_CLIENT_ID="SEU_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="SEU_GOOGLE_CLIENT_SECRET"

# Secret da Aplicação
NEXTAUTH_SECRET="UMA_CHAVE_SECRETA_FORTE_PARA_A_SESSAO"
NEXTAUTH_URL="http://localhost:3000"
```
---

## � Requisitos e Funcionalidades

### 🔐 Autenticação e Segurança
* **Login Único:** Integração nativa com Gmail via BetterAuth.
* **Multi-tenancy:** Garantido via ZenStack. Cada usuário acessa estritamente os seus dados.
* **Políticas de Acesso:** Definição no nível do banco de dados (schema.zmodel).

### 🚘 Gestão de Veículos
* **Cadastro:** Marca, modelo, ano, valor pago, KM inicial e código FIPE.
* **Informações Técnicas:** Campo dedicado para observações gerais (ex: "Óleo 5w40 Sintético", "Pressão: 32 psi frente, 33 trás").
* **KM Atual:** Campo de atualização rápida para manter os alertas precisos.

### 🛠️ Plano de Manutenção (Referência)
* Configuração de intervalos recomendados:
    * **Por Quilometragem:** (Ex: Trocar velas a cada 10.000 km).
    * **Por Tempo:** (Ex: Trocar fluido de arrefecimento a cada 2 anos).
* **Alertas Dinâmicos:** O sistema dispara notificações visuais quando a manutenção se aproxima do limite (KM ou Data).

### 📝 Registro de Atividades
* Lançamento de manutenções realizadas (baseadas em referências ou avulsas).
* **Campos:** Data, KM no ato, valor gasto, previsão da próxima revisão.
* **Anexos:** Upload de foto de comprovantes ou Notas Fiscais (Supabase Storage).
* **Categorização:**
    * Arrefecimento, Óleo, Elétrica, Motor, Suspensão, Pneus, Impostos (IPVA/Licenciamento), Seguros e Outros.

### 📊 Dashboard e KPIs
* **Total Investido:** Soma de todas as manutenções + valor de compra do veículo.
* **Total Rodado:** Diferença entre o KM inicial e o KM atual.
* **Custo por KM:** Cálculo automático: `(Total Gasto em Manutenção + Impostos + Seguros) / (KM Atual - KM Inicial)`.
* **Timeline:** Histórico cronológico de serviços realizados.

---
