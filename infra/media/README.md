# Product-image storage

`media/` is an independent Terraform root module. It creates a private, encrypted,
versioned S3 bucket for original product images, allows browser `POST`/`GET` through
the configured CORS origins, and outputs the IAM policy that the API runtime needs
to sign uploads and verify uploaded objects.

The bucket does not grant public object access. The API must return presigned URLs;
the browser never receives AWS credentials.

## Apply

From this directory:

```powershell
terraform init
$env:TF_VAR_web_app_origins = '["http://localhost:5173"]'
terraform plan -var "bucket_name=<globally-unique-bucket-name>"
terraform apply -var "bucket_name=<globally-unique-bucket-name>"
```

Attach `API_MEDIA_POLICY_ARN` to the API runtime IAM principal. For local
development, attach it to the IAM user represented by the active AWS SDK
credential chain.

Set the printed values in `apps/lb-api/.env`:

```dotenv
AWS_REGION=ap-southeast-1
PRODUCT_IMAGE_BUCKET=<PRODUCT_IMAGE_BUCKET output>
```

When the application moves to a deployed AWS runtime, attach the policy to that
runtime role instead of relying on a developer IAM user.
