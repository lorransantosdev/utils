---
name: lorran-metricas
description: Use quando o Lorran (@lorrandev) pedir para analisar métricas, ver como os posts foram, fazer a revisão semanal ou mensal, ou entender por que um post flopou ou viralizou.
---

# Leitura de métricas e aprendizado — @lorrandev

Objetivo: puxar os números reais direto dos Insights, transformar em razões que comparam posts de tamanhos diferentes, julgar cada post pelo objetivo da camada dele e fechar o ciclo atualizando os aprendizados. Nunca inventar ou estimar métrica: se não conseguiu ler, diga.

## 0. Contexto

`project_read` em `claude/estrategia-conteudo-2026-11.md` para os limiares, a média da conta e os aprendizados anteriores.

## 1. Coletar

Instagram pelo Claude in Chrome (ele está logado como @lorrandev): siga `references/coleta-instagram.md`, que tem as URLs dos Insights, o script de coleta por post que funciona e como pegar a legenda de cada post.

- **Retenção e taxa de pulo** não aparecem na web: peça ao Lorran um print da tela de Insights do reel no app (tempo médio, gráfico de retenção, taxa de pulo) para os 3 reels mais importantes da semana.
- **YouTube** (canal @lorranndev) e **TikTok** (@lorrandev): leia a lista de vídeos com views pela página pública; para retenção do YouTube, peça print do YouTube Studio ou abra o Studio se ele estiver logado.

## 2. Calcular (sempre razão, nunca número cru)

Para cada post:
- **Envios/alcance** = compartilhamentos ÷ visualizadores. Bom: > 2%.
- **Salvamentos/alcance** = salvamentos ÷ visualizadores. Bom: > 3%.
- **Seguidores por 10 mil views** = seguidores ÷ views × 10.000. Média de referência: 24,3 (nov/2026). Bom: > 25.
- **% não seguidores**. Bom em camada 1: > 60%.
- **Comentários por 1.000 views** (sinal de conversa).
- **Visita → seguidor** quando houver visitas. Bom: > 25%.

Rode a conta em código (Python ou JS), não de cabeça.

## 3. Julgar pelo objetivo da camada

Classifique cada post: série, camada (1–4), momento (vaga, vida dupla, campeão, SaaS, ou nenhum), formato, horário. Julgue só pela métrica que manda naquela camada:
- Camada 1: envios/alcance e % não seguidores.
- Camada 2: seguidores por 10 mil views.
- Camada 3: salvamentos/alcance, retenção, inscritos.
- Camada 4: membros novos e respostas no canal/CF.

Para todo post abaixo do limiar, diagnostique **uma** causa principal:
- **Ideia** (ninguém precisava disso, ou não é um dos 4 momentos)
- **Embalagem** (frame 0/hook/capa fracos: alcance baixo e pouca gente passou dos 3s)
- **Execução** (passou do hook mas a curva cai no meio: trecho morto, promessa não cumprida)
- **Conversão** (alcançou e reteve, mas o CTA ou o perfil não converteram)

Compare com a "Previsão" que a skill `lorran-roteiro` deixou no roteiro do post, se existir.

## 4. Decidir

Três decisões, não mais:
1. **Repetir:** o que bateu o limiar vira próximo episódio ou parte 2 (> 200 envios = vira vídeo ou longo).
2. **Cortar ou mudar:** o que falhou 2 vezes pela mesma causa sai da pauta.
3. **Testar:** um hook ou formato novo na semana, com hipótese escrita ("capa com prazo vs sem prazo").

## 5. Entregar

1. Uma frase com o resultado da semana e o número que importa.
2. Para revisão semanal: tabela no chat (post · camada · views · não seg. % · envios/alcance · salv./alcance · seg./10k · veredito · causa). Para revisão mensal ou se ele pedir para guardar: um Dashboard ou Sheet com os dados e um gráfico de seguidores por 10 mil views por tipo.
3. As 3 decisões.
4. Atualize a seção "Aprendizados" de `claude/estrategia-conteudo-2026-11.md` (ler, acrescentar 1–3 linhas datadas, `project_write` do arquivo inteiro). Se a média de seguidores por 10 mil views ou outro limiar mudou de forma consistente por 4 semanas, atualize o número de referência também. Aprendizado só entra se apareceu em 2+ posts; caso isolado vira observação.

## Armadilhas

- Post velho tem mais views só por ter mais tempo: compare janelas iguais (7 dias após postar) quando possível.
- Reel de teste não vai pro feed dos seguidores: não compare com post normal.
- Uma semana é amostra pequena: não mude a estratégia por 1 post; mude por padrão.
- 57,6% das views vindo de seguidores (nov/2026) significa alcance novo fraco; acompanhe essa porcentagem mês a mês.

## Arquivos desta skill

| precisa de | leia |
|---|---|
| URLs dos Insights, script de coleta, legenda por post | references/coleta-instagram.md |
