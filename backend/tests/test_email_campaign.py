import unittest
from unittest.mock import MagicMock, patch

from app.services.unisender import UnisenderService
from app.services.email_campaign import EmailCampaignService
from app.models.auth import User
from app.models.venue import Venue
from app.models.menu import Menu


class EmailCampaignTests(unittest.TestCase):
    def test_compile_template_replaces_placeholders(self) -> None:
        service = UnisenderService()
        template = "Hello {{name}}, welcome to {{dashboard_url}}! Your email is {{email}}."
        context = {
            "name": "Иван",
            "dashboard_url": "https://dashboard.kwikmenu.ru",
            "email": "ivan@example.com",
        }
        result = service.compile_template(template, context)
        self.assertEqual(
            result,
            "Hello Иван, welcome to https://dashboard.kwikmenu.ru! Your email is ivan@example.com.",
        )

    def test_compile_template_handles_missing_keys(self) -> None:
        service = UnisenderService()
        template = "Hello {{name}}, your balance is {{balance}}."
        context = {
            "name": "Иван",
        }
        result = service.compile_template(template, context)
        self.assertEqual(result, "Hello Иван, your balance is {{balance}}.")

    @patch("app.services.unisender.requests.post")
    @patch("app.services.unisender.get_settings")
    def test_send_email_unisender_go(self, mock_get_settings, mock_post) -> None:
        # Mock settings
        settings = MagicMock()
        settings.unisender_api_key = "test_key"
        settings.unisender_service_type = "go"
        settings.unisender_go_api_url = "https://goapi.unisender.ru"
        settings.unisender_sender_email = "no-reply@kwikmenu.ru"
        settings.unisender_sender_name = "KwikMenu"
        mock_get_settings.return_value = settings

        # Mock requests response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "success",
            "result": {"job_id": 12345},
        }
        mock_post.return_value = mock_response

        service = UnisenderService()
        job_id = service.send_email(
            to_email="test@example.com",
            subject="Hello {{name}}",
            body_html="Link: {{dashboard_url}}",
            scheduled_email_id="sched_1",
            user_context={"name": "Alice", "dashboard_url": "http://dashboard"},
        )

        self.assertEqual(job_id, "12345")
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertEqual(args[0], "https://goapi.unisender.ru/email/send.json")
        self.assertEqual(
            kwargs["json"]["message"]["recipients"][0]["email"],
            "test@example.com",
        )
        self.assertEqual(kwargs["json"]["message"]["subject"], "Hello Alice")
        self.assertEqual(
            kwargs["json"]["message"]["body"]["html"], "Link: http://dashboard"
        )

    @patch("app.services.unisender.requests.post")
    @patch("app.services.unisender.get_settings")
    def test_send_email_unisender_classic(
        self, mock_get_settings, mock_post
    ) -> None:
        # Mock settings
        settings = MagicMock()
        settings.unisender_api_key = "test_key"
        settings.unisender_service_type = "classic"
        settings.unisender_classic_api_url = "https://api.unisender.com/ru/api/"
        settings.unisender_classic_list_id = "list_123"
        settings.unisender_sender_email = "no-reply@kwikmenu.ru"
        settings.unisender_sender_name = "KwikMenu"
        mock_get_settings.return_value = settings

        # Mock requests response
        mock_response = MagicMock()
        mock_response.json.return_value = {"result": {"email_id": 98765}}
        mock_post.return_value = mock_response

        service = UnisenderService()
        email_id = service.send_email(
            to_email="test@example.com",
            subject="Hello {{name}}",
            body_html="Link: {{dashboard_url}}",
            scheduled_email_id="sched_1",
            user_context={"name": "Alice", "dashboard_url": "http://dashboard"},
        )

        self.assertEqual(email_id, "98765")
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertEqual(
            args[0], "https://api.unisender.com/ru/api/sendEmail"
        )
        self.assertEqual(kwargs["data"]["email"], "test@example.com")
        self.assertEqual(kwargs["data"]["subject"], "Hello Alice")
        self.assertEqual(kwargs["data"]["body"], "Link: http://dashboard")

    def test_evaluate_condition_always(self) -> None:
        service = EmailCampaignService()
        db_mock = MagicMock()
        user = User(id="user_123", name="Alice")

        self.assertTrue(service.evaluate_condition(db_mock, user, "always"))
        self.assertTrue(service.evaluate_condition(db_mock, user, "ALWAYS"))

    def test_evaluate_condition_no_venue(self) -> None:
        service = EmailCampaignService()
        db_mock = MagicMock()
        user = User(id="user_123", name="Alice")

        # When count returns 0
        db_mock.query().filter().count.return_value = 0
        self.assertTrue(service.evaluate_condition(db_mock, user, "no_venue"))

        # When count returns 1
        db_mock.query().filter().count.return_value = 1
        self.assertFalse(service.evaluate_condition(db_mock, user, "no_venue"))

    def test_evaluate_condition_no_menu(self) -> None:
        service = EmailCampaignService()
        db_mock = MagicMock()
        user = User(id="user_123", name="Alice")

        # Case 1: user has no venues at all
        db_mock.query().filter().all.return_value = []
        self.assertTrue(service.evaluate_condition(db_mock, user, "no_menu"))

        # Case 2: user has venues, but 0 menus
        venue = Venue(id="venue_1", owner_user_id="user_123")
        db_mock.query().filter().all.return_value = [venue]
        db_mock.query().filter().count.return_value = 0
        self.assertTrue(service.evaluate_condition(db_mock, user, "no_menu"))

        # Case 3: user has venues, and >= 1 menu
        db_mock.query().filter().count.return_value = 2
        self.assertFalse(service.evaluate_condition(db_mock, user, "no_menu"))

    def test_webhook_process_single_event(self) -> None:
        from app.api.routes.unisender_webhook import _process_single_event
        from app.models.email_campaign import ScheduledEmail

        db_mock = MagicMock()
        scheduled_email = ScheduledEmail(
            id="sched_123",
            unisender_message_id="msg_456",
            delivery_status="none"
        )
        db_mock.query().filter().first.return_value = scheduled_email

        event = {
            "event_name": "transactional_email_status",
            "event_data": {
                "job_id": "msg_456",
                "email": "test@example.com",
                "status": "delivered"
            }
        }

        _process_single_event(db_mock, event)

        self.assertEqual(scheduled_email.delivery_status, "delivered")
        db_mock.add.assert_called_with(scheduled_email)


if __name__ == "__main__":
    unittest.main()
