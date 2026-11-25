# Beatriz Gonçalves Studio

Site de uma nail designer de Vila Velha - ES. Apresenta os serviços do studio, permite que a cliente **agende o horário online** e dá à profissional um painel para acompanhar os agendamentos.

Feito com **HTML, CSS e JavaScript puro**, sem framework e sem etapa de build.

## Funcionalidades

**Para a cliente**
- Apresentação do studio, galeria de serviços com foto, duração e preço
- Agendamento em etapas: escolher o serviço, a data no calendário, o horário e informar os dados de contato
- Horários já ocupados ficam bloqueados; domingos e datas passadas não podem ser escolhidas
- Código do agendamento para **consultar o status** depois (pendente, confirmado, concluído ou cancelado)
- Seção "sobre", depoimentos de clientes e contato (WhatsApp, Instagram e email)

**Para a profissional (painel restrito)**
- Acesso por senha
- Lista de todos os agendamentos, com alteração de status

## Serviços cadastrados

Unhas de gel, lixamento, remoção de cutículas, hidratação profunda, esmaltação tradicional e esmaltação em gel. Os serviços, preços, durações e horários de atendimento ficam no topo do `script.js` (`SVCS` e `SLOTS`).

## Estrutura

```
Beatriz-Studio/
├── index.html    # página única (site, agendamento e painel)
├── style.css     # estilos
├── script.js     # calendário, horários, agendamento e painel
├── config.js     # configuração pública (sem a senha)
├── config.example.js
├── build-config.js  # gera config.local.js a partir de variável de ambiente
├── vercel.json   # configuração de deploy na Vercel
└── imagens/      # fotos dos serviços
```

## Como rodar

Não precisa instalar nada. Abra a pasta no VS Code e rode o `index.html` com a extensão **Live Server**, ou abra o arquivo direto no navegador.

## Senha do painel e deploy

**Localmente:** copie `config.example.js` para `config.local.js` e coloque sua senha em `ADMIN_SENHA`.

**Na Vercel:** importe o repositório (Framework Preset: **Other**), cadastre a variável `ADMIN_SENHA` em Settings → Environment Variables e faça o deploy. O `build-config.js` gera o `config.local.js` automaticamente. Se a variável faltar, o build falha e avisa.

## Personalização

- **Senha do painel:** não fica no repositório. Ela vem de `config.local.js` (ignorado pelo Git) e, na Vercel, da variável de ambiente `ADMIN_SENHA` (veja a seção abaixo). Sem senha configurada, o painel não abre.
- **Serviços e horários:** `SVCS` e `SLOTS` no `script.js`.
- **WhatsApp, email e Instagram:** links no `index.html`. Troque pelos dados reais.

## Limitações

Este é um projeto 100% front-end, sem servidor nem banco de dados:
- Os agendamentos ficam no **localStorage do navegador**. Eles não são compartilhados entre dispositivos, então um horário reservado por uma cliente não aparece como ocupado para outra pessoa, nem no painel de outro computador.
- A senha do painel está no código e pode ser lida por quem inspecionar o site. Ela **não é uma proteção real**.

Para uso em produção, o agendamento e o painel precisam de um back-end com banco de dados (por exemplo, Supabase ou Firebase).
