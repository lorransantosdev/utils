#!/usr/bin/env python3
"""Builds the two example worlds shipped with the skill (all fictional data)."""
import json, random, pathlib
random.seed(7)
OUT = pathlib.Path(__file__).parent
PAINT = ['#F4F5F7', '#2A2D33', '#C3C8CF', '#868C96', '#D33A2C', '#2F5FD0', '#E8B53A', '#2E6B4C']
CNAME = ['white', 'black', 'silver', 'grey', 'red', 'blue', 'yellow', 'green']
MODELS = ['Corolla', 'Civic', 'Model 3', 'Golf', 'Yaris', 'Kona', 'Leaf', 'Polo', 'Onix', 'Clio']

# ---------------------------------------------------------------- 1. monitor: a car-rental network
places, vehicles, people, actions = [], [], [], []
shops = [('north', 'Harbor North', 12, 9), ('down', 'Harbor Downtown', 12, 11), ('air', 'Harbor Airport', 15, 13)]
vid = 0
for sid, name, cap, n in shops:
    road = 0
    for k in range(n):
        st = random.choices(['road', 'waiting', 'parked'], [5, 2, 3])[0]
        ci = random.randrange(len(PAINT)); m = random.choice(MODELS); vid += 1; v_id = f'v{vid}'
        overdue = st == 'road' and random.random() < .25
        v = {'id': v_id, 'place': sid, 'state': st, 'name': m, 'color': PAINT[ci], 'colorName': CNAME[ci],
             'alert': 'red' if overdue else None, 'tip': '1 payment overdue' if overdue else None,
             'listSub': 'on the road until Nov 30' if st == 'road' else 'pick-up today' if st == 'waiting' else f'{random.randint(8, 90)}k km',
             'stateText': 'with a driver until Nov 30' if st == 'road' else 'driver waiting at the counter' if st == 'waiting' else 'ready to rent',
             'page': {'subtitle': f'{2020 + random.randint(0, 5)} · hybrid', 'blocks': [
                 *([{'type': 'bar', 'label': 'Contract', 'value': 12, 'max': 30, 'text': 'day 12 of 30'}, {'type': 'bar', 'label': 'Payments', 'value': 2, 'max': 4, 'text': '2 of 4', 'tone': 'green'}] if st == 'road' else []),
                 *([{'type': 'alerts', 'items': [{'sev': 'red', 'title': '1 payment overdue', 'text': 'Call the driver today.'}]}] if overdue else []),
                 {'type': 'kv', 'title': 'Details', 'items': [['Weekly rate', f'${random.randint(180, 420)}'], ['Mileage', f'{random.randint(8, 90)},000 km']]}]},
             'lines': ['Ready when you are!'] if st == 'parked' else None}
        if st in ('road', 'waiting'):
            pid = 'd' + v_id; v['driver'] = pid
            people.append({'id': pid, 'role': 'driver', 'place': sid, 'state': 'drive' if st == 'road' else 'wait', 'vehicle': v_id,
                           'lines': [f'Got the {m} until Nov 30', 'Paid 2 of 4 so far'] if st == 'road' else [f'Here to pick up the {m}!'],
                           'tip': f'driving the {m}' if st == 'road' else f'waiting for the {m}',
                           'page': {'subtitle': f'Driver · {m} {CNAME[ci]}'}})
        if overdue: actions.append({'sev': 'red', 'title': f'Payment overdue · {m}', 'text': 'Call the driver today.', 'place': sid, 'target': {'t': 'vehicle', 'id': v_id}})
        vehicles.append({k: x for k, x in v.items() if x is not None})
        road += st == 'road'
    places.append({'id': sid, 'kind': 'shop', 'name': name, 'private': True, 'capacity': cap, 'sub': 'Branch · open 7am–10pm', 'signSub': 'Harbor Rentals',
                   'inbox': {'count': random.randint(1, 4), 'label': 'Contracts to sign'},
                   'screen': {'title': "Today's board", 'tiles': [{'label': 'On the road', 'value': f'{road}/{n}', 'tone': 'brand'}, {'label': 'Pick-ups today', 'value': random.randint(1, 4), 'tone': 'blue'}, {'label': 'Revenue (month)', 'value': f'${random.randint(9, 30)}k', 'tone': 'green'}], 'bar': {'label': 'Fleet in use', 'value': road, 'max': n}},
                   'page': {'blocks': [{'type': 'stats', 'items': [{'label': 'On the road', 'value': road, 'of': n}, {'label': 'Revenue this month', 'value': f'${random.randint(9, 30)},400'}, {'label': 'Utilisation', 'value': f'{round(road / n * 100)}%'}, {'label': 'Overdue', 'value': '$640', 'tone': 'red'}]}]}})
    people.append({'id': 'm-' + sid, 'role': 'manager', 'place': sid, 'state': 'wander', 'lines': [f'{road} cars out today', 'Busy morning!'], 'tip': 'branch manager'})
    people.append({'id': 's-' + sid, 'role': 'staff', 'place': sid, 'state': 'work', 'lines': ['Next, please!'], 'tip': 'front desk'})
actions.append({'sev': 'amber', 'title': '6 trials end this week', 'text': 'Call the ones who added a car.', 'place': 'trial'})
places.append({'id': 'trial', 'kind': 'cluster', 'name': 'Free trials', 'mark': 'T', 'sub': '24 companies trying the product', 'signSub': '24 companies on a free trial', 'card': '24 trials · 7 with a car', 'gridNote': 'green = added a car (7)', 'page': {'blocks': [{'type': 'funnel', 'title': 'Trial funnel', 'items': [{'label': 'Signed up', 'value': 24}, {'label': 'Added a car', 'value': 7}, {'label': 'Active this week', 'value': 4}]}, {'type': 'note', 'text': '17 of 24 never added a car — call them before the trial ends.'}]}})
for i in range(24): people.append({'id': f't{i}', 'role': 'trial', 'place': 'trial', 'state': 'wander' if i < 4 else 'idle', 'done': i < 7, 'lines': ['Just looking around 👀'] if i < 4 else ['Signed up, never came back']})
places.append({'id': 'hq', 'kind': 'tower', 'name': 'Harbor HQ', 'signTitle': 'HARBOR', 'floors': 4, 'vault': 23, 'sub': '1 floor per $2k of monthly revenue',
               'vaultText': '23 gold bars = 23 open rentals', 'nextFloor': 'Next floor at $10k MRR (+$1.6k)',
               'screen': {'title': 'Monthly recurring revenue', 'big': '$8,420', 'line': '3 branches · 24 trials · 32 cars', 'funnel': [{'label': 'Trials', 'value': 24}, {'label': 'Added a car', 'value': 7}, {'label': 'Active this week', 'value': 4}, {'label': 'Paying', 'value': 3, 'tone': 'green'}], 'spark': {'title': 'Fleet', 'items': [{'label': 'Jul', 'value': 12}, {'label': 'Aug', 'value': 19}, {'label': 'Sep', 'value': 26}, {'label': 'Oct', 'value': 32}]}},
               'page': {'blocks': [{'type': 'stats', 'items': [{'label': 'MRR', 'value': '$8,420', 'sub': '+12% vs last month', 'tone': 'green'}, {'label': 'Branches', 'value': 3}, {'label': 'Trials', 'value': 24}, {'label': 'Open rentals', 'value': 23}]}, {'type': 'funnel', 'title': 'Trial funnel', 'items': [{'label': 'Trials', 'value': 24}, {'label': 'Added a car', 'value': 7}, {'label': 'Active this week', 'value': 4}, {'label': 'Paying', 'value': 3, 'tone': 'green'}]}]}})
for i in range(8): people.append({'id': f'e{i}', 'role': 'team', 'place': 'hq', 'state': 'work' if i < 5 else 'idle', 'lines': ['Shipping the new dashboard', 'Coffee first ☕', 'On a call'][i % 3:i % 3 + 1]})
places.append({'id': 'park', 'kind': 'park', 'name': 'Harbor Square'})
rental = {
    'version': 2,
    'meta': {'title': 'Harbor Rentals', 'subtitle': 'Network · admin view', 'locale': 'en', 'currency': 'USD', 'palette': 'cream', 'asOf': '2026-10-19T09:30:00Z',
             'brand': {'name': 'Harbor', 'color': '#0E9F94'}, 'alias': {'place': 'Branch'}},
    'roles': {'manager': {'label': 'Branch manager', 'color': '#10B981'}, 'staff': {'label': 'Front desk', 'color': '#0E9F94'}, 'driver': {'label': 'Driver', 'color': '#3B82F6'}, 'trial': {'label': 'Trial account', 'color': '#A3A8AF'}, 'team': {'label': 'Harbor team', 'color': '#F59E0B'}},
    'states': {'road': {'label': 'On the road', 'tone': 'brand', 'moving': True}, 'waiting': {'label': 'Reserved', 'tone': 'blue'}, 'parked': {'label': 'In the lot', 'tone': 'green'}},
    'kpis': [{'label': 'MRR · 3 branches', 'value': 8420, 'format': 'currency', 'ref': {'t': 'place', 'id': 'hq'}}, {'label': 'Cars on the road', 'value': sum(v['state'] == 'road' for v in vehicles), 'format': 'int', 'sub': f'of {len(vehicles)}'}, {'label': 'Needs attention', 'value': len(actions), 'format': 'int', 'sub': f"{sum(a['sev'] == 'red' for a in actions)} urgent", 'tone': 'red', 'ref': {'t': 'actions'}}],
    'home': {'label': 'Network', 'title': 'Harbor network', 'subtitle': f'3 branches · 24 trials · {len(vehicles)} cars'},
    'places': places, 'vehicles': vehicles, 'people': people, 'actions': actions,
    'player': {'name': 'You', 'role': 'admin', 'label': 'You', 'cap': '#0E9F94'},
    'pet': {'line': 'Your dog. Goes wherever you go.'},
    'companions': [{'name': 'Mia', 'rel': 'sister', 'greet': 'Hey you!', 'look': {'shirt': '#EC4899', 'style': 'long'}}, {'name': 'Theo', 'rel': 'friend', 'greet': 'Yo!', 'look': {'shirt': '#6366F1', 'style': 'short'}}],
    'timeline': {'label': 'Last 7 days', 'title': 'Last 7 days', 'from': '2026-10-12T09:00:00Z', 'to': '2026-10-19T09:00:00Z', 'seconds': 40,
                 'events': [{'at': f'2026-10-{12 + i // 3:02d}T{8 + (i * 5) % 12:02d}:00:00Z', 'place': shops[i % 3][0], 'vehicle': vehicles[i]['id'], 'state': 'road' if i % 2 else 'parked', 'from': 'parked' if i % 2 else 'road', 'text': f"{vehicles[i]['name']} {'left' if i % 2 else 'came back'}", 'tone': 'brand' if i % 2 else 'green', **({'amount': 240 + i * 10} if i % 3 == 0 else {})} for i in range(18)]},
}
(OUT / 'rental.world.json').write_text(json.dumps(rental, indent=1, ensure_ascii=False))

# ---------------------------------------------------------------- 2. explain: an online shop's services, with journeys
svc = [('gateway', 'API Gateway', 'office', 2, '#6366F1', 'Every request comes in here: auth, rate limits, routing.'),
       ('orders', 'Orders', 'office', 3, '#0EA5E9', 'Creates the order, reserves stock, asks for payment.'),
       ('payments', 'Payments', 'office', 2, '#10B981', 'Charges the card through the PSP. Idempotent by order id.'),
       ('stock', 'Warehouse', 'shop', None, '#F59E0B', 'Stock and shipping. The vans are the deliveries.'),
       ('notify', 'Notifications', 'office', 1, '#EC4899', 'E-mails and push: order confirmed, shipped, delivered.'),
       ('platform', 'Platform', 'tower', 3, '#111827', 'Shared infra: databases, queues, observability.')]
P2, V2, H2 = [], [], []
for sid, name, kind, floors, col, what in svc:
    p = {'id': sid, 'kind': kind, 'name': name, 'color': col if kind != 'tower' else None, 'sub': what, 'page': {'blocks': [{'type': 'note', 'text': what}, {'type': 'kv', 'title': 'Health', 'items': [['p95', f'{random.randint(40, 180)} ms'], ['Errors', f'{random.random() * .8:.2f}%'], ['Calls/min', f'{random.randint(200, 3000):,}']]}]}}
    if floors: p['floors'] = floors
    if sid == 'payments': p['status'] = 'warn'; p['card'] = 'p95 820 ms · PSP slow'
    if sid == 'stock': p['capacity'] = 8; p['signSub'] = 'Stock & shipping'
    if sid == 'platform': p['vault'] = 12; p['vaultText'] = '12 bars = 12 deploys this week'; p['nextFloor'] = 'A floor per 1k req/s of peak traffic'; p['signTitle'] = 'PLATFORM'
    P2.append({k: v for k, v in p.items() if v is not None})
    for i in range(3 if kind != 'tower' else 6):
        H2.append({'id': f'{sid}-{i}', 'role': 'eng', 'place': sid, 'state': 'work' if i < 2 else 'idle', 'lines': [f'On call for {name}' if i == 0 else 'Reviewing a PR']})
for i in range(6):
    st = 'road' if i < 3 else 'parked'
    V2.append({'id': f'van{i}', 'place': 'stock', 'state': st, 'name': f'Delivery #{4120 + i}', 'color': '#F4F5F7', 'colorName': 'van', 'stateText': 'out for delivery' if st == 'road' else 'waiting to be loaded', 'lines': ['Out for delivery 📦'] if st == 'road' else ['Waiting for parcels']})
P2.append({'id': 'park', 'kind': 'park', 'name': 'Lunch square'})
J = [
    {'title': 'Checkout', 'steps': [
        {'place': 'gateway', 'title': '1 · The order arrives', 'text': 'The app sends the cart to the gateway. It checks the token and the rate limit.', 'payload': 'POST /orders { cart: 3 items, total: 89.90 }'},
        {'move': {'from': 'gateway', 'to': 'orders', 'say': 'POST /orders'}, 'title': '2 · Orders creates it', 'text': 'Orders saves it as PENDING and reserves the stock.'},
        {'move': {'from': 'orders', 'to': 'payments', 'say': 'charge 89.90'}, 'title': '3 · Payment', 'text': 'Payments charges the card. The order id is the idempotency key, so a retry never charges twice.', 'payload': '{ "status": "PAID", "psp_id": "ch_81f…" }'},
        {'move': {'from': 'payments', 'to': 'stock', 'say': 'ship order 4127'}, 'title': '4 · Ship it', 'text': 'The warehouse picks the parcel; a van leaves.'},
        {'move': {'from': 'stock', 'to': 'notify', 'say': 'order shipped'}, 'title': '5 · Tell the customer', 'text': 'Notifications sends “your order is on the way”.'},
        {'ref': {'t': 'home'}, 'title': 'Done', 'text': '5 services, ~1.2 s end to end.'}]},
    {'title': 'Card declined', 'steps': [
        {'move': {'from': 'gateway', 'to': 'orders'}, 'title': '1 · Same start', 'text': 'Order created as PENDING.'},
        {'move': {'from': 'orders', 'to': 'payments'}, 'place': 'payments', 'fail': True, 'title': '2 · Declined', 'text': 'The PSP says “insufficient funds”. Payments answers 402 and the order is cancelled; the stock is released.', 'payload': '{ "error": "card_declined", "code": 402 }'},
        {'place': 'notify', 'title': '3 · Tell the customer', 'text': 'A friendly message with a link to try another card.'}]},
]
micro = {
    'version': 2,
    'meta': {'title': 'Shopwave', 'subtitle': 'How an order travels', 'locale': 'en', 'palette': 'mint', 'purpose': 'explain', 'brand': {'name': 'Shopwave', 'color': '#6366F1'}},
    'roles': {'eng': {'label': 'Engineer', 'color': '#6366F1'}},
    'states': {'road': {'label': 'Out for delivery', 'tone': 'brand', 'moving': True}, 'parked': {'label': 'At the dock', 'tone': 'green'}},
    'kpis': [{'label': 'Orders today', 'value': 1284, 'format': 'int', 'sub': '+8% vs yesterday'}, {'label': 'Checkout p95', 'value': '1.2 s'}, {'label': 'Degraded', 'value': 1, 'format': 'int', 'sub': 'Payments', 'tone': 'red', 'ref': {'t': 'place', 'id': 'payments'}}],
    'home': {'title': 'Shopwave services', 'subtitle': '5 services and the platform underneath', 'blocks': [{'type': 'list', 'of': 'places', 'title': 'Services'}]},
    'places': P2, 'vehicles': V2, 'people': H2,
    'actions': [{'sev': 'amber', 'title': 'Payments p95 at 820 ms', 'text': 'The PSP is slow since 09:10.', 'place': 'payments'}],
    'journeys': J, 'tour': {'label': 'Checkout', 'steps': J[0]['steps']},
    'player': {'name': 'You', 'role': 'new engineer'},
}
(OUT / 'microservices.world.json').write_text(json.dumps(micro, indent=1, ensure_ascii=False))
print('ok', len(vehicles), len(people), len(V2), len(H2))
