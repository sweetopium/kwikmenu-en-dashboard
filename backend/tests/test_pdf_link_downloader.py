import tempfile
import unittest
from email.message import Message
from io import BytesIO
from pathlib import Path
from unittest.mock import patch

from app.services.pdf_link_downloader import PdfLinkDownloadError, download_pdf_from_url


class FakeResponse:
    def __init__(self, *, url: str, body: bytes, content_type: str, content_disposition: str | None = None) -> None:
        self._url = url
        self._buffer = BytesIO(body)
        self.headers = Message()
        self.headers.add_header("Content-Type", content_type)
        if content_disposition:
            self.headers.add_header("Content-Disposition", content_disposition)

    def read(self, size: int = -1) -> bytes:
        return self._buffer.read(size)

    def geturl(self) -> str:
        return self._url

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class PdfLinkDownloaderTests(unittest.TestCase):
    @patch("app.services.pdf_link_downloader.socket.getaddrinfo")
    @patch("app.services.pdf_link_downloader.request.urlopen")
    def test_downloads_direct_pdf(self, mock_urlopen, mock_getaddrinfo) -> None:
        mock_getaddrinfo.return_value = [(None, None, None, None, ("93.184.216.34", 443))]
        mock_urlopen.return_value = FakeResponse(
            url="https://example.com/menu.pdf",
            body=b"%PDF-1.7\nfake-pdf",
            content_type="application/pdf",
        )

        with tempfile.TemporaryDirectory() as temp_dir:
            result = download_pdf_from_url(
                url="https://example.com/menu.pdf",
                target_dir=Path(temp_dir),
            )

            self.assertEqual(result.file_name, "menu.pdf")
            self.assertEqual(result.mime_type, "application/pdf")
            self.assertTrue((Path(temp_dir) / "menu.pdf").exists())

    @patch("app.services.pdf_link_downloader.socket.getaddrinfo")
    @patch("app.services.pdf_link_downloader.request.urlopen")
    def test_rejects_non_pdf_response(self, mock_urlopen, mock_getaddrinfo) -> None:
        mock_getaddrinfo.return_value = [(None, None, None, None, ("93.184.216.34", 443))]
        mock_urlopen.return_value = FakeResponse(
            url="https://example.com/menu.html",
            body=b"<!doctype html><html></html>",
            content_type="text/html",
        )

        with tempfile.TemporaryDirectory() as temp_dir:
            with self.assertRaisesRegex(
                PdfLinkDownloadError,
                "Сейчас по ссылке можно импортировать только PDF",
            ):
                download_pdf_from_url(
                    url="https://example.com/menu.html",
                    target_dir=Path(temp_dir),
                )

    @patch("app.services.pdf_link_downloader.socket.getaddrinfo")
    def test_rejects_private_host(self, mock_getaddrinfo) -> None:
        mock_getaddrinfo.return_value = [(None, None, None, None, ("127.0.0.1", 443))]

        with tempfile.TemporaryDirectory() as temp_dir:
            with self.assertRaisesRegex(
                PdfLinkDownloadError,
                "Укажите публичную прямую ссылку на PDF-файл меню",
            ):
                download_pdf_from_url(
                    url="https://localhost/menu.pdf",
                    target_dir=Path(temp_dir),
                )


if __name__ == "__main__":
    unittest.main()
