import json

# 1) Загружаем данные
with open('pull_reviews.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
pull_reviews = data['pullReviews']

# 2) Определяем мэппинги весов
complexity_weight = {'Low': 1.0, 'Medium': 1.5, 'High': 2.0}
confidence_weight = {'Low': 0.75, 'Medium': 1.0, 'High': 1.25}

# 3) Функция для агрегации одной метрики (с сохранением деталей)
def aggregate_metric(reviews, metric_key):
    num = 0.0
    den = 0.0
    details = []

    for pr in reviews:
        pr_id = pr['pull']['id']
        comp = pr['complexity']['classification']
        conf = pr[metric_key]['confidence']
        score = pr[metric_key]['score']
        w = complexity_weight[comp] * confidence_weight[conf]

        # добавляем к суммам
        num += score * w
        den += w

        # сохраняем детальную запись для вывода
        details.append({
            'id':        pr_id,
            'complexity': comp,
            'confidence': conf,
            'score':      score,
            'weight':     round(w, 3)
        })

    agg_score = num / den if den > 0 else 0.0

    return {
        'aggregatedScore': round(agg_score, 2),
        'details': details
    }

# 4) Собираем итоговый summary по всем трём метрикам
metrics = ['antiPatterns', 'codeStyle', 'designPatterns']
summary = {}
for m in metrics:
    summary[m] = aggregate_metric(pull_reviews, m)

# 5) Выводим результат
print(json.dumps(summary, ensure_ascii=False, indent=2))
