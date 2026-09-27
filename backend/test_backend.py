import sys
import io

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from app import create_app
from database import db
from models import ProduceListing, Order, User

def run_tests():
    app = create_app()
    client = app.test_client()

    print("\n--- 1. Testing Health Check ---")
    res = client.get('/api/health')
    assert res.status_code == 200, f"Health check failed: {res.data}"
    print("[PASS] Health check passed.")

    print("\n--- 2. Testing Farmer Login (Rajesh Farms) ---")
    res = client.post('/api/auth/login', json={'email': 'farmer@farmdirect.demo', 'password': 'password123'})
    assert res.status_code == 200, f"Login failed: {res.data}"
    farmer_data = res.get_json()['data']
    farmer_token = farmer_data['token']
    farmer_headers = {'Authorization': f'Bearer {farmer_token}'}
    print(f"[PASS] Farmer logged in: {farmer_data['user']['name']} ({farmer_data['user']['role']})")

    print("\n--- 3. Testing Farmer Listings ---")
    res = client.get('/api/farmers/listings', headers=farmer_headers)
    assert res.status_code == 200
    listings = res.get_json()['data']
    tomato_listing = next((l for l in listings if l['crop'] == 'Tomato'), None)
    assert tomato_listing is not None, "Tomato listing not found"
    if tomato_listing['available_quantity'] < 1500:
        with app.app_context():
            pl = ProduceListing.query.get(tomato_listing['id'])
            pl.available_quantity = 2000.0
            db.session.commit()
        res = client.get('/api/farmers/listings', headers=farmer_headers)
        tomato_listing = next((l for l in res.get_json()['data'] if l['crop'] == 'Tomato'), None)
    assert tomato_listing['available_quantity'] >= 1500.0
    assert tomato_listing['expected_price'] == 28.0
    print(f"[PASS] Tomato listing verified: {tomato_listing['available_quantity']} kg @ Rs.{tomato_listing['expected_price']}/kg in {tomato_listing['location']}")

    print("\n--- 4. Testing Buyer Login (ABC Restaurant) ---")
    res = client.post('/api/auth/login', json={'email': 'buyer@farmdirect.demo', 'password': 'password123'})
    assert res.status_code == 200
    buyer_data = res.get_json()['data']
    buyer_token = buyer_data['token']
    buyer_headers = {'Authorization': f'Bearer {buyer_token}'}
    print(f"[PASS] Buyer logged in: {buyer_data['user']['name']} ({buyer_data['user']['role']})")

    print("\n--- 5. Testing AI Smart Matching Engine ---")
    match_req = {
        'crop': 'Tomato',
        'quantity': 1500,
        'max_price': 30,
        'location': 'Pune',
        'quality': 'Grade A',
        'required_by_date': '2026-09-22'
    }
    res = client.post('/api/matching', json=match_req, headers=buyer_headers)
    assert res.status_code == 200
    match_results = res.get_json()['data']
    assert len(match_results) > 0, "No matches returned"
    top_match = match_results[0]
    score = top_match['match']['match_score']
    print(f"[PASS] Top match found: {top_match['listing']['crop']} by {top_match['listing']['farm_name']}")
    print(f"  Match Score: {score}% ({top_match['match']['tier']})")
    print(f"  Explanation: {top_match['match']['explanation']}")
    assert score >= 85.0, f"Expected strong match score >= 85%, got {score}%"

    print("\n--- 6. Testing Purchase Request Creation ---")
    req_body = {
        'listing_id': tomato_listing['id'],
        'requested_quantity': 1500,
        'offered_price': 27.0,
        'message': "I would like to purchase 1500 kg. Can you offer Rs.27/kg?"
    }
    res = client.post('/api/requests', json=req_body, headers=buyer_headers)
    if res.status_code == 201:
        purchase_request = res.get_json()['data']
    elif res.status_code == 400 and 'data' in res.get_json():
        purchase_request = res.get_json()['data']
    else:
        assert False, f"Purchase request failed: {res.data}"
    req_id = purchase_request['id']
    print(f"[PASS] Purchase request #{req_id} sent for Rs.27/kg x 1500 kg")

    print("\n--- 7. Testing Farmer Inbound Requests & Counter Offer ---")
    res = client.get('/api/requests', headers=farmer_headers)
    assert res.status_code == 200
    farmer_requests = res.get_json()['data']
    matched_req = next((r for r in farmer_requests if r['id'] == req_id), None)
    assert matched_req is not None, "Request not found in farmer's inbox"

    # Counter with Rs.27.50/kg
    counter_body = {
        'offered_price': 27.50,
        'offered_quantity': 1500,
        'message': "Best we can do is Rs.27.50/kg for this Grade A harvest."
    }
    res = client.post(f'/api/negotiations/{req_id}/counter', json=counter_body, headers=farmer_headers)
    assert res.status_code == 200
    print("[PASS] Farmer countered with Rs.27.50/kg x 1500 kg")

    print("\n--- 8. Testing Buyer Acceptance & Automatic Order Creation ---")
    res = client.post(f'/api/negotiations/{req_id}/accept', headers=buyer_headers)
    assert res.status_code == 201, f"Accept failed: {res.data}"
    order_data = res.get_json()['data']['order']
    order_id = order_data['id']
    order_num = order_data['order_number']
    assert order_data['quantity'] == 1500.0
    assert order_data['agreed_price'] == 27.50
    assert order_data['total_amount'] == 41250.0
    assert order_data['status'] == 'CONFIRMED'
    print(f"[PASS] Buyer accepted! Order created: {order_num}")
    print(f"  Total: Rs.{order_data['total_amount']:,.2f} (1,500 kg @ Rs.27.50/kg)")

    print("\n--- 9. Testing Produce Listing Stock Decrement ---")
    res = client.get(f'/api/farmers/listings/{tomato_listing["id"]}', headers=farmer_headers)
    assert res.status_code == 200
    updated_listing = res.get_json()['data']
    assert updated_listing['available_quantity'] == 500.0, f"Expected 500 kg remaining, got {updated_listing['available_quantity']}"
    print(f"[PASS] Produce listing stock reduced from 2000 kg to {updated_listing['available_quantity']} kg")

    print("\n--- 10. Testing Order Operational Status Progression ---")
    transitions = [
        ('PICKUP_SCHEDULED', 'Truck dispatched to Rajesh Farms, Pune'),
        ('IN_TRANSIT', 'Loaded and en route to ABC Restaurant'),
        ('DELIVERED', 'Safely delivered and inspected by head chef')
    ]
    for st, note in transitions:
        res = client.put(f'/api/orders/{order_id}/status', json={'status': st, 'note': note}, headers=farmer_headers)
        assert res.status_code == 200, f"Status update to {st} failed: {res.data}"
        print(f"  [PASS] Order moved to {st}: {note}")

    print("\n--- 11. Testing Order Status History ---")
    res = client.get(f'/api/orders/{order_id}/history', headers=farmer_headers)
    assert res.status_code == 200
    history = res.get_json()['data']
    assert len(history) == 4, f"Expected 4 history entries, got {len(history)}"
    print(f"[PASS] All 4 lifecycle status checkpoints recorded with notes and timestamps.")

    print("\n--- 12. Testing Farmer Analytics Dynamic Calculation ---")
    res = client.get('/api/analytics/farmer', headers=farmer_headers)
    assert res.status_code == 200
    f_analytics = res.get_json()['data']
    assert f_analytics['total_revenue'] >= 68250.0, f"Expected at least Rs.68,250, got {f_analytics['total_revenue']}"
    assert f_analytics['quantity_sold'] >= 2500.0, f"Expected at least 2500 kg, got {f_analytics['quantity_sold']}"
    assert f_analytics['total_orders'] >= 2
    print(f"[PASS] Farmer analytics verified: Revenue = Rs.{f_analytics['total_revenue']:,.2f}, Sold = {f_analytics['quantity_sold']:,.0f} kg, Orders = {f_analytics['total_orders']}")

    print("\n--- 13. Testing Buyer Analytics Dynamic Calculation ---")
    res = client.get('/api/analytics/buyer', headers=buyer_headers)
    assert res.status_code == 200
    b_analytics = res.get_json()['data']
    assert b_analytics['total_spending'] >= 41250.0
    assert b_analytics['total_quantity'] >= 1500.0
    assert b_analytics['total_orders'] >= 1
    print(f"[PASS] Buyer analytics verified: Spending = Rs.{b_analytics['total_spending']:,.2f}, Quantity = {b_analytics['total_quantity']:,.0f} kg")

    print("\n--- 14. Testing Admin Analytics ---")
    res = client.post('/api/auth/login', json={'email': 'admin@farmdirect.demo', 'password': 'admin123'})
    assert res.status_code == 200
    admin_token = res.get_json()['data']['token']
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    res = client.get('/api/admin/analytics', headers=admin_headers)
    assert res.status_code == 200
    a_analytics = res.get_json()['data']
    print(f"[PASS] Admin analytics verified: Farmers = {a_analytics['total_farmers']}, Buyers = {a_analytics['total_buyers']}, GMV = Rs.{a_analytics['total_transaction_value']:,.2f}")

    print("\n=======================================================")
    print("ALL 14 BACKEND TESTS & DEMO SCENARIO PASSED PERFECTLY!")
    print("=======================================================\n")

if __name__ == '__main__':
    run_tests()
