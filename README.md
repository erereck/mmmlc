# MMM Level Creator

Editor estatico para criar prototipos de fases do MMM Overdose no mesmo canvas 960 x 540 usado pelo PowerPoint.

Inclui os 13 exemplos jogaveis do pacote Legacy sem decoracao, mais ferramentas para plataformas, morte, moeda, portal, mola, agua, gelo, powerups, gravidade, gravidade global de coop, portas e barreiras de player/co-op.

O editor esconde as sintaxes internas sempre que possivel. Portas usam ID amigavel, molas vazias valem forca 450, temporarias podem comecar invisiveis, e plataformas moveis usam campos separados de inicio, fim e velocidade enquanto o texto interno e gerado automaticamente. Outros objetos tambem podem ser marcados como moveis no eixo horizontal ou vertical; nesse caso o movimento sai como sufixo no nome (`#?'120.420.90` ou `#@'Y:80.360.90`) e o texto continua livre para forca, ID ou tipo. Variacoes como plataforma ghost, barreira P2, porta invertida e gravidade global ficam no botao **Alternar variacao** do inspetor.

Atalhos uteis: `Ctrl+C`, `Ctrl+V`, `Ctrl+D`, `V`, `Delete`, setas para mover, `Shift+setas` para mover mais rapido e botao direito para acoes rapidas do objeto.

Use **Exportar JSON** para gerar o arquivo da fase atual. Use **Exportar tudo** para gerar um pacote com todas as fases abertas no editor. O JSON ja sai com `left`, `top`, `width`, `height`, nomes/textos internos do PowerPoint e dados de gameplay para um importador VBA futuro.

## Rodar local

```powershell
cd "C:\Users\erick\3D Objects\MMM Overdose\mmm-level-creator"
python -m http.server 5177 --bind 127.0.0.1
```

Abra `http://127.0.0.1:5177`.

## Deploy

Pode subir a pasta inteira no Vercel como site estatico. A entrada e `index.html`.
