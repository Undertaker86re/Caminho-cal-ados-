# Caminho Calçados & Confecções — e-commerce

Site de vendas com banco de dados, feito a partir dos mockups (PDF) e da documentação do projeto
(entrevista, requisitos, lista de eventos e casos de uso).

**Tecnologia:** Node.js + SQLite, **sem nenhuma dependência para instalar** (só módulos nativos do Node).
Front-end em JavaScript puro (SPA), responsivo.

## Como rodar

Requer **Node.js 22.5 ou superior** (https://nodejs.org).

```bash
cd caminho
npm start            # abre em http://localhost:3000
npm test             # teste automático dos fluxos principais (48 verificações)
```

Na primeira execução o banco (`data/caminho.db`) é criado com 18 produtos de exemplo e um funcionário:

| Perfil | E-mail | Senha |
|---|---|---|
| Funcionário (painel em `/admin`) | `admin@caminho.com.br` | `Caminho@2026` |

**Troque essa senha antes de publicar.** Para já nascer com outra, rode a 1ª vez com
`ADMIN_PASSWORD="sua-senha" ADMIN_EMAIL="seu@email" npm start`. Clientes se cadastram em `/cadastro`.
Cupom de exemplo: `BEMVINDO10` (10%).

## O que existe

**Loja (8 telas do mockup):** Início · Produtos (filtros por categoria, tamanho, cor, preço + busca) · Login · Cadastro ·
Checkout (entrega, frete, cupom, Pix/Cartão/Boleto) · Compra confirmada · Sobre nós · Contato (mapa e "como chegar").
Também: página do produto (cor, tamanho, quantidade, estoque, frete), carrinho, recuperação de senha.

**Área do cliente:** meus dados, meus pedidos com acompanhamento, reclamação e devolução (prazo de 7 dias após a entrega) e exclusão da própria conta.

**Painel da loja (`/admin`):** relatórios · pedidos (status, rastreio, cancelamento) · produtos e variações/estoque (com foto) ·
atendimento e devoluções · venda assistida (funcionário vende em nome do cliente) · clientes e funcionários ·
mensagens do contato · integração Bling · auditoria · configurações (textos, contatos, cupons, depoimentos).

## PWA (app instalável)

O site é um PWA: `manifest.json`, `sw.js` (cache + offline), `offline.html`, `JS/pwa.js`
(instalação e avisos) e o trecho PWA no fim de `CSS/style.css` (layout de app no celular: barra inferior Início · Produtos · Carrinho · Conta).
- Instalar exige **HTTPS** (ou `localhost`). No Android/Chrome aparece o convite "Instalar o app"; no iPhone: Compartilhar → Adicionar à Tela de Início.
- Pedidos, conta e painel (`/api` e `/admin`) **nunca** passam pelo cache. Só a leitura do catálogo (início, produtos, depoimentos) é guardada; sem internet o app mostra o que já foi visitado, e a tela "sem conexão" aparece quando não há nada guardado.
- Ao alterar CSS/JS, mude `VERSION` em `sw.js` (hoje `caminho-v8`) para forçar atualização.

## Como o projeto atende a documentação

| Documento | Onde está |
|---|---|
| RF01–RF08 | cadastro/login por perfil · produtos · catálogo · compra · pedidos · atendimento · Bling · painel |
| RNF1/RNF2 | interface simples, botões grandes, menu "hambúrguer" e colunas que se reorganizam no celular |
| RNF3 | senhas com hash scrypt + sal · sessão por cookie HttpOnly · cabeçalhos de segurança · cartão **nunca** é gravado |
| RN01 | só funcionário altera produtos/pedidos (API devolve 403) |
| RN02 | cliente só vê os próprios pedidos e solicitações |
| RN03 | estoque conferido e baixado dentro de transação (o último par só é vendido uma vez) |
| RN04 | cada variação (tamanho + cor) tem SKU e estoque próprios |
| RN05 | pedido só segue as transições permitidas (aguardando → pago → separação → enviado → entregue; cancelar antes do envio) |
| RN06/RN07 | devolução ligada a pedido e itens, só após entrega e dentro do prazo |
| RN08/RN09 | fila de sincronização com Bling sem duplicar; falhas registradas e reprocessáveis |
| RN10 | tabela de auditoria de ações administrativas |

Tabelas do banco: `usuarios, sessoes, produtos, variacoes, cupons, pedidos, pedido_itens, pagamentos, pedido_historico,
atendimentos, atendimento_itens, atendimento_historico, mensagens_contato, depoimentos, bling_sync, auditoria, configuracoes`
(veja `server/db.js`).

## Exclusão de conta

Em *Minha conta → Meus dados* o cliente digita a senha e confirma. O servidor (`excluirConta` em `server/services.js`):

- só deixa excluir se não houver pedido em andamento nem atendimento aberto;
- apaga tudo dentro de **uma transação** (se algo falhar, nada é apagado);
- respeita as chaves estrangeiras: primeiro atendimentos e pedidos (itens, pagamentos e histórico saem por `ON DELETE CASCADE`), depois o usuário (sessões e links de senha também saem em cascata);
- nos registros de auditoria e histórico que citam o usuário, o `usuario_id` vira `NULL`.

## O que é simulado ou precisa ser preenchido

- **Pagamento:** não há gateway real. Cartão é validado e "aprovado" (final `0002` simula recusa); Pix e boleto geram um
  código fictício e o pedido fica "aguardando pagamento" até o funcionário confirmar no painel. Para vender de verdade,
  integre um gateway (Mercado Pago, Pagar.me etc.) em `processarPagamento` (`server/services.js`).
- **Bling:** roda em modo **simulado** (marca como enviado). Para conectar defina `BLING_ACCESS_TOKEN`; o envio real
  (`server/bling.js`) **não foi testado** contra o Bling — revise os campos com a documentação oficial.
- **Login com Google:** o botão do mockup está lá, mas avisa que não está configurado (exige credenciais OAuth do Google).
- **E-mail de recuperação de senha:** sem servidor de e-mail, o link aparece no console do servidor (e na tela fora de produção).
- **Frete:** tabela simples por região do CEP (valores de exemplo em `calcularFrete`).
- **Textos e números de exemplo:** preços dos produtos, texto de "Sobre nós", desconto Pix (5%) — troque no painel.
  WhatsApp, e-mail, horário, "desde" e "avaliação média" ficam **ocultos** até serem preenchidos em Configurações.
  Depoimentos só aparecem quando houver depoimentos reais cadastrados.

## Publicar (HTTPS)

Rode atrás de um proxy com certificado SSL (Nginx/Caddy/Cloudflare) e use `NODE_ENV=production` — isso ativa cookie
`Secure` e HSTS. Variáveis: `PORT`, `DB_PATH`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `BLING_ACCESS_TOKEN`, `WEB3FORMS_KEY`. Faça backup do arquivo `data/caminho.db`.

## Estrutura

Organizada no mesmo padrão do projeto *Mago do Comércio* (raiz = site; pastas `CSS/`, `JS/`, `Assets/`):

```
index.html · offline.html · manifest.json · sw.js     (raiz do site)
CSS/      style.css                                   (estilos da loja + layout de app/PWA)
JS/       script.js (roteador/app) · lib.js · views-shop.js · views-account.js · views-admin.js · pwa.js
Assets/   logos · hero.jpg · icons/ · produtos/
uploads/  fotos enviadas pelo painel
server/   index.js (rotas/API) · services.js (regras) · db.js (schema) · auth.js · bling.js · seed.js · smoke-test.js
data/     caminho.db (banco SQLite)
```
Só `index.html`, `offline.html`, `manifest.json`, `sw.js` e as pastas `CSS/`, `JS/`, `Assets/` e `uploads/` são servidos ao público;
`server/`, `data/` e `package.json` nunca são expostos. Bancos criados antes da mudança são migrados sozinhos (`/img/` → `/Assets/`).

## Formulário de contato (Web3Forms)

A mensagem do formulário de **Contato** é gravada no banco (aparece no painel, em mensagens do contato) e, se existir a chave do
Web3Forms, também é enviada para o e-mail cadastrado nele.

1. Em https://web3forms.com, informe o e-mail da loja e copie a *Access Key* que chegar por e-mail.
2. Defina a variável de ambiente `WEB3FORMS_KEY` com essa chave (no Render: *Environment*; local: `WEB3FORMS_KEY="sua-chave" npm start`).
3. Sem a variável, o formulário continua funcionando, só salva no banco.

A chave do Web3Forms é pública por natureza (o navegador a usa para enviar), não dá acesso à caixa de e-mail.

## Subir para o GitHub

```bash
git init -b main
git add .
git commit -m "Primeira versão do e-commerce Caminho Calçados"
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

O `.gitignore` já impede o envio de `data/` (banco de dados), `uploads/` (fotos enviadas), `node_modules/` e `.env`.
Num servidor novo o banco é criado sozinho na primeira execução, com os 18 produtos de exemplo.
No Render, use o arquivo `render.yaml` como Blueprint. Ele configura Node.js 22, `NODE_ENV=production`, senha inicial aleatória para o funcionário, banco SQLite em disco persistente (`/var/data/caminho.db`) e pasta de imagens enviadas em `/var/data/uploads`. O plano definido no Blueprint é `starter` (pago), necessário para o disco persistente. Revise as variáveis no painel do Render após a primeira publicação e guarde a senha gerada de administrador em local seguro. Não publique a senha no GitHub.

## Documentação acadêmica do projeto

A pasta `DOCUMENTACAO/` reúne os itens da lista de requisitos do projeto:

- `Projeto_Caminho_Calcados_Documentacao_Completa.docx` e `.pdf`: identidade visual, roteiro de entrevista, ODS 8 e 17, ficha de problematização, relatório de requisitos, diagramas de atividades e casos de uso, documentação de 15 casos de uso, diagrama de classes, lista de eventos, DFD nível zero, justificativa do PWA/SPA, integração ViaCEP, mapa de empatia e MER/DER.
- `Roteiro_Entrevista_Comerciante.docx` e `.pdf`: formulário para aplicar e registrar a entrevista verdadeira.
- `LEIA-ME_DOCUMENTACAO.md`: relação entre os itens da lista e as entregas.
- `diagramas/`: fontes Graphviz (`.dot`), imagens PNG e versões SVG dos diagramas.

**Atenção:** a entrevista precisa ser realizada e preenchida com respostas reais. A problematização e o mapa de empatia são hipóteses de projeto até essa validação. Pagamento, cálculo de frete e integração Bling continuam em modo demonstrativo/simulado, conforme explicado na documentação.


### Foto da seção Sobre nós

A imagem `Assets/sobre-nos.jpg` é exibida na página `/sobre-nos`, ao lado do texto institucional. Para substituí-la, mantenha esse nome de arquivo ou atualize o caminho em `JS/views-shop.js`. O service worker foi versionado para atualizar o cache dos dispositivos.
