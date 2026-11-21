# Integração Flynex ↔ Caminho Calçados

Relação: a **Flynex** (fábrica de software B2B) é a fornecedora; a **Caminho Calçados & Confecções** é cliente B2B dela.

| Ponto de contato | Onde fica | O que faz |
|---|---|---|
| Crédito no rodapé | Caminho, todas as páginas | "Sistema desenvolvido pela Flynex" com link para o site da Flynex |
| Suporte Flynex | Caminho, painel `/admin/flynex` | Abre o formulário da Flynex já com assunto e empresa preenchidos |
| Página de cliente | Flynex, `clientes.html` (+ seção no `index.html`, menu e rodapé) | Mostra a Caminho como caso/cliente, com link para a loja e o Instagram |
| Pré-preenchimento | Flynex, `JS/main.js` | `contato.html?assunto=suporte&empresa=...` preenche o formulário |
| Instagram + contato | Caminho, rodapé (desktop e celular) e página Contato | Instagram da loja ao lado de endereço, WhatsApp e e-mail |

## O que ajustar (uma vez)
- **Instagram da Caminho:** `@caminhocalcados` é provisório. Troque em Painel → Configurações → "Instagram da loja" (aceita @usuário ou link) e em `JS/clientes.js` (Flynex).
- **Endereço da loja no site da Flynex:** `CAMINHO_URL` em `JS/clientes.js` (hoje `http://localhost:3000`).
- **Endereço do site da Flynex na Caminho:** variável `FLYNEX_URL` (padrão `https://undertaker86re.github.io/Flynex/`).
- Ao mudar CSS/JS da Caminho, `VERSION` do `sw.js` já foi para `caminho-v9`.
