# GIHS System — Enterprise Intelligence
## Documento Oficial de Arquitetura, Governança e Especificação do Sistema

> **Conceito Central:** *“Gestão da empresa em 100% monitorada.”*  
> **Slogan:** *“Tudo conectado. Todos os processos monitorados.”*

---

## 1. Visão Geral do Sistema e Objetivos

O **GIHS System** atua como o "Sistema Operacional Corporativo" para uma empresa de Tecnologia da Informação. Ele elimina a fragmentação de dados dispersos em planilhas isoladas, grupos de WhatsApp, e-mails e anotações avulsas, centralizando todas as operações em uma arquitetura de dados unificada, auditável e em tempo real persistida no PostgreSQL.

A plataforma interliga de ponta a ponta:
- **Administrativo & RH**: Governança, quadro de colaboradores, folha/espelho de ponto, formulários dinâmicos e auditoria contínua.
- **Operação de Suporte (N1, N2, N3)**: Triagem imediata, resolução avançada, infraestrutura, contingência e escalonamento entre níveis.
- **Engenharia de Software (Front-End & Back-End)**: Entregas semanais, Kanban ágil, arquitetura de microsserviços e sustentação de pipelines.
- **Banco de Dados (DBA)**: Monitoramento de clusters (PostgreSQL, MongoDB), tunning de queries e replicação.
- **Segurança da Informação (Cyber Security)**: Telemetria de firewalls (NGFW), auditoria SIEM, prevenção de intrusão e compliance LGPD.
- **Comercial & Marketing**: Captação e atendimento multicanal (WhatsApp Business CRM), geração de conteúdo com IA (Social AI, Instagram, TikTok).

---

## 2. Matriz de Perfis e Controle de Acesso (RBAC)

O sistema adota o padrão **Role-Based Access Control (RBAC)** estrito, garantindo segregação de funções e respeito à privacidade (LGPD):

| Perfil | Nível de Hierarquia | Escopo de Visão | Ações Permitidas |
| :--- | :---: | :--- | :--- |
| **SUPER ADMINISTRADOR** | 1 (Executivo) | Acesso Global a todos os setores e bases | Criação/edição/bloqueio de usuários, gestão de setores, matriz de permissões, auditoria forense, parametrização de IA e APIs externas. |
| **ADMINISTRATIVO** | 2 (Gestão Interna) | RH, Financeiro, Gestão e Visão Geral de Ponto/Equipes | Cadastro de colaboradores, geração de planilhas inteligentes, aprovações de ponto/espelho, controle de formulários e relatórios administrativos. |
| **GESTOR** | 3 (Liderança Setorial) | Setor do Gestor (ex: Suporte N3, Front-End, DBA) | Acompanhamento do Kanban da equipe, alocação de tarefas semanais, aprovação de atividades, monitoramento de produtividade e SLA do time. |
| **COLABORADOR** | 4 (Operacional) | Dados Pessoais e tarefas atribuídas ao seu usuário | Meu Kanban, preenchimento do formulário de Registro de Atividades, batida de ponto eletrônico (com/sem câmera), consulta à agenda e AI Hub individual. |

---

## 3. Modelo de Dados e Relacionamentos das Entidades

```
   [USERS / EMPLOYEES] ──────┬────── [ATTENDANCE] ───── [ATTENDANCE_PHOTOS]
            │                │
            │ 1:N            │ 1:N
            ▼                ▼
     [DEPARTMENTS]    [ACTIVITIES] (Registro de Atividades)
            │                │
            │ 1:N            │ Vinculação direta
            ▼                ▼
         [TASKS] ◄───── [KANBAN_COLUMNS] ◄───── [KANBANS] (Pessoal / Equipe / Semanal)
            │
            ├──────► [TASK_COMMENTS]
            └──────► [TASK_HISTORY]

   [CUSTOMERS] ──────► [WHATSAPP_CONVERSATIONS] ──────► [WHATSAPP_MESSAGES]
            │                    │
            └────────────────────┴──────► [CRM_OPPORTUNITY & TASKS]

   [FORMS] ──────────► [FORM_FIELDS] ──────────► [FORM_RESPONSES] ──► [SPREADSHEETS]

   [AUDIT_LOGS] ◄─── Conectado a TODAS as mutações de dados (Create, Update, Delete, Export, Login)
```

### Principais Tabelas Relacionais:
1. **users**: id, email, password_hash, role (enum), is_blocked, created_at, updated_at.
2. **employees**: id, user_id (FK), name, area, sector, registration_number, avatar_url, admission_date, status.
3. **attendance**: id, employee_id (FK), date, entry_time, lunch_start, lunch_end, exit_time, total_hours, overtime_minutes, delay_minutes, status, ip_address.
4. **attendance_photos**: id, attendance_id (FK), photo_data_url, captured_at, device_metadata.
5. **tasks**: id, title, description, priority (Alta, Média, Baixa, Crítica), status (Backlog, A Fazer, Em Andamento, Em Revisão, Concluído), sector_id, assignee_id (FK), due_date, week_code (ex: 2026-W38).
6. **activities**: id, employee_id (FK), sector, activity_title, description, activity_type, priority, status, time_spent_minutes, task_id (FK opcional), created_at.
7. **calendar_events**: id, title, start_time, end_time, category (Reunião, Suporte, Treinamento, etc.), attendees_json, location, created_by.
8. **audit_logs**: id, timestamp, user_name, user_id, action_type, module, description, severity (Info, Warning, Critical), ip_address.
9. **whatsapp_conversations**: id, customer_id, phone, status, unread_count, assigned_to, related_task_id.
10. **social_posts**: id, platform (Instagram, TikTok), topic, script_text, storyboard_json, status (Planejado, Publicado), scheduled_date.

---

## 4. Fluxo Intersetorial de Atendimento & Resolução

O fluxo operacional de uma demanda técnica complexa no GIHS System flui com rastreabilidade total:

1. **Cliente / Comercial**: Contato via WhatsApp Business ou Chamado Formal.
2. **Triagem N1**: Atendimento preliminar, validação de credenciais e solução de nível 1.
3. **Escalonamento N2**: Diagnóstico de rede, configurações de infraestrutura local e estações.
4. **Escalonamento N3**: Engenharia de redes, roteamento de borda (BGP), firewalls corporativos.
5. **Engenharia (Dev Front/Back)**: Correção de bug no código-fonte ou liberação de nova rota na API.
6. **Banco de Dados (DBA)**: Ajuste de locks concorrentes, otimização de índices e queries.
7. **Cyber Security**: Validação de conformidade, análise de logs e liberação de porta segura.
8. **Resolução & Comunicação**: Conclusão da tarefa no Kanban, registro automático da atividade e feedback final ao cliente.

---

## 5. Estratégia de Mocks & Prontidão para APIs Oficiais

Conforme exigido nas diretrizes de prototipação:
- **Google Calendar**: Mock local reativo simulando criação, exclusão e geração de links Meet (`https://meet.gihs.com.br/sala-[id]`). Interface tipada para futura sincronização com Google Workspace OAuth (`set_up_oauth`).
- **WhatsApp Business API**: Estrutura de chat centralizado (inbox) com cards de clientes, envio de mensagens e conversão direta em chamados/tarefas com CRM. Pronta para receber Webhooks da Cloud API do WhatsApp / Meta Graph API.
- **Instagram & TikTok**: Gerador de roteiros, legendas e carrosséis com IA. Pronta para Meta Graph API for Instagram e TikTok Marketing API.
- **Inteligência Artificial (AI Hub)**: Motor de geração contextual com prompts de negócios integrável à SDK `@google/genai` (Gemini API server-side).

---

## 6. Governança, Rastreabilidade e LGPD

- **Auditoria Contínua**: 100% das ações (Login, Logout, Registro de Ponto, Criação/Alteração de Tarefas, Exportação de Planilhas Excel/CSV/PDF, Modificações Administrativas) geram entradas no módulo de Auditoria.
- **Soft Delete**: Registros críticos (colaboradores, tarefas, formulários) utilizam exclusão lógica e flag `is_deleted` ou `is_blocked`.
- **Validação de Câmera no Ponto**: Captura em canvas de vídeo do navegador no instante da batida de ponto com consentimento explícito, armazenando o snapshot associado ao registro de jornada.
