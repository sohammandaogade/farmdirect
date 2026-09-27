import unittest
import json
from app import create_app
from database import db
from models import User
from seed import seed_database

class TestAuthPersistence(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        if self._testMethodName == 'test_01_registration_and_immediate_login':
            u = User.query.filter_by(email="persist_farmer@test.com").first()
            if u:
                db.session.delete(u)
                db.session.commit()

    def tearDown(self):
        self.ctx.pop()

    def test_01_registration_and_immediate_login(self):
        # Register new farmer
        reg_payload = {
            "name": "Persistence Farmer",
            "email": "persist_farmer@test.com",
            "phone": "+91 99999 11111",
            "password": "SecretPassword123",
            "role": "farmer",
            "farm_name": "Persistence Farm",
            "farm_location": "Pune",
            "farm_size": "10 acres",
            "primary_crops": "Tomato"
        }
        res = self.client.post('/api/auth/register', json=reg_payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIn('token', data['data'])

        # Immediate login
        login_res = self.client.post('/api/auth/login', json={
            "email": "persist_farmer@test.com",
            "password": "SecretPassword123"
        })
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.get_json()
        self.assertTrue(login_data['success'])
        self.assertEqual(login_data['data']['user']['email'], "persist_farmer@test.com")

    def test_02_idempotent_seed_preserves_users(self):
        # Ensure user exists before seed
        user_before = User.query.filter_by(email="persist_farmer@test.com").first()
        self.assertIsNotNone(user_before)

        # Run seed_database twice
        seed_database()
        seed_database()

        # Verify user still exists after seeds
        user_after = User.query.filter_by(email="persist_farmer@test.com").first()
        self.assertIsNotNone(user_after)
        self.assertEqual(user_after.name, "Persistence Farmer")

        # Verify login still works with original password
        login_res = self.client.post('/api/auth/login', json={
            "email": "persist_farmer@test.com",
            "password": "SecretPassword123"
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertTrue(login_res.get_json()['success'])

    def test_03_wrong_password_fails(self):
        login_res = self.client.post('/api/auth/login', json={
            "email": "persist_farmer@test.com",
            "password": "WrongPassword!"
        })
        self.assertEqual(login_res.status_code, 401)
        self.assertFalse(login_res.get_json()['success'])

    def test_04_unknown_email_fails(self):
        login_res = self.client.post('/api/auth/login', json={
            "email": "nonexistent_user_999@test.com",
            "password": "Password123"
        })
        self.assertEqual(login_res.status_code, 401)
        self.assertFalse(login_res.get_json()['success'])

    def test_05_duplicate_registration_fails(self):
        dup_payload = {
            "name": "Duplicate Person",
            "email": "persist_farmer@test.com",
            "phone": "+91 99999 22222",
            "password": "AnotherPassword123",
            "role": "farmer",
            "farm_location": "Nashik"
        }
        res = self.client.post('/api/auth/register', json=dup_payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("already exists", res.get_json()['message'])

    def test_06_case_insensitive_login(self):
        login_res = self.client.post('/api/auth/login', json={
            "email": "PERSIST_FARMER@TEST.COM",
            "password": "SecretPassword123"
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertTrue(login_res.get_json()['success'])

if __name__ == '__main__':
    unittest.main()
