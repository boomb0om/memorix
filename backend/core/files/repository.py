import aioboto3
from core.configs.s3 import s3_settings


class FilesRepository:
    def __init__(self):
        self.session = aioboto3.Session()
        self.endpoint_url = s3_settings.endpoint_url
        self.access_key = s3_settings.access_key
        self.secret_key = s3_settings.secret_key
        self.bucket_name = s3_settings.bucket_name

    async def upload_file(self, file_content: bytes, s3_path: str) -> None:
        async with self.session.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key
        ) as s3_client:
            await s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_path,
                Body=file_content
            )

    async def download_file(self, s3_path: str) -> bytes:
        async with self.session.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key
        ) as s3_client:
            response = await s3_client.get_object(
                Bucket=self.bucket_name,
                Key=s3_path
            )
            async with response['Body'] as stream:
                return await stream.read()


files_repository = FilesRepository()

