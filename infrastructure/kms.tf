resource "aws_kms_key" "env_vars" {
  description         = "Key to encrypt/decrypt environment variables"
  enable_key_rotation = true

  tags {
    stage   = "${terraform.env}"
    service = "${var.service}"
  }
}

resource "aws_kms_alias" "env_vars" {
  name          = "alias/${var.service}-${terraform.env}-env-vars"
  target_key_id = "${aws_kms_key.env_vars.key_id}"
}
