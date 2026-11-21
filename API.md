# API da Caminho Calçados

API REST em JSON. É a **única** forma de ler e gravar os dados da loja: o site, o app (PWA) e o console Python usam as mesmas rotas.

- **Endereço base:** o do servidor da Caminho (local: `http://localhost:3000`; publicado: o endereço HTTPS do deploy). A API fica "pública" ao publicar o servidor com HTTPS.
- **Formato:** requisições com corpo usam `Content-Type: application/json`. Respostas são JSON; erros vêm como `{"erro": "mensagem legível", ...}` com o código HTTP adequado (400 dados inválidos, 401 sem login, 402 pagamento recusado, 403 sem permissão, 404 não encontrado, 409 conflito de estoque/duplicidade, 429 muitas tentativas).
- **Autenticação:** `POST /api/auth/login` devolve o cookie de sessão `sid` (HttpOnly); clientes não-navegador devem guardar e reenviar o cookie. Perfis: `cliente` e `funcionario`.
- **Dinheiro:** valores em reais (número com 2 casas).

## Rotas públicas (sem login)
| Método e rota | O que faz |
|---|---|
| `GET /api/produtos?q=&categoria=&tamanho=&cor=&ordem=` | Lista produtos ativos (`{produtos:[{id,nome,categoria,preco,preco_final,desconto_pct,disponivel,...}]}`) |
| `GET /api/produtos/:id` | Detalhe com `variacoes:[{id,sku,tamanho,cor,estoque}]` |
| `POST /api/frete` `{cep}` | Opções de frete (`economico`, `expresso`) |
| `POST /api/carrinho/precificar` `{itens:[{variacao_id,quantidade}],cep,entrega,cupom,metodo}` | Calcula subtotal, frete, descontos e total, com avisos de estoque |
| `POST /api/contato` `{nome,email,mensagem}` | Mensagem para a loja |
| `POST /api/auth/cadastro` `{nome,email,cpf,telefone,senha,senha2}` | Cria conta de cliente |
| `POST /api/auth/login` `{email,senha}` · `POST /api/auth/logout` | Sessão |

## Cliente (login)
| Método e rota | O que faz |
|---|---|
| `GET /api/auth/me` · `PUT /api/auth/me` `{nome,telefone}` · `DELETE /api/auth/me` `{senha}` | Ver, alterar e excluir a própria conta |
| `POST /api/pedidos` `{itens,cep,entrega,cupom,nome,cpf,endereco,metodo,cartao?}` | Cria o pedido e baixa o estoque (`metodo`: `pix`, `cartao`, `boleto`) → `{numero}` |
| `GET /api/pedidos` · `GET /api/pedidos/:numero` | Meus pedidos e detalhe (itens, pagamento, histórico, `pode_devolver`) |
| `GET /api/atendimentos` · `GET /api/atendimentos/:protocolo` | Minhas solicitações |
| `POST /api/atendimentos` `{tipo:"devolucao"\|"reclamacao",pedido,motivo,itens:[{pedido_item_id,quantidade}]}` | Abre devolução ou reclamação → `{protocolo}` |

## Funcionário (login com perfil `funcionario`)
| Método e rota | O que faz |
|---|---|
| `GET /api/admin/pedidos?q=&status=` · `GET /api/admin/pedidos/:numero` | Todos os pedidos |
| `POST /api/admin/pedidos/:numero/status` `{status,observacao,rastreio}` | Muda a situação (transições validadas; cancelar exige motivo e devolve estoque) |
| `GET /api/admin/produtos` · `GET /api/admin/produtos/:id` · `PUT /api/admin/produtos/:id` | Produtos e estoque por variação |
| `GET /api/admin/atendimentos?status=` · `GET /api/admin/atendimentos/:protocolo` | Solicitações |
| `POST /api/admin/atendimentos/:protocolo/acao` `{acao,mensagem}` | `analisar`, `pedir_info`, `responder`, `aprovar`, `recusar`, `concluir` |
| `GET /api/admin/relatorios?dias=30` · `GET /api/admin/auditoria` | Relatório e auditoria |

Há também rotas administrativas de cupons, clientes, funcionários, depoimentos, Bling e configurações (todas em `/api/admin/*`, só para funcionário).

## Exemplo (curl)
```bash
curl "$API/api/produtos?q=tênis"
curl -c jar.txt -H 'Content-Type: application/json' -d '{"email":"maria@email.com","senha":"senha12345"}' "$API/api/auth/login"
curl -b jar.txt "$API/api/pedidos"
```
