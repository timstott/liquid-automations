resource "aws_s3_bucket" "deployment" {
  bucket = "${var.service}-${terraform.env}-deployments"

  tags {
    stage   = "${terraform.env}"
    service = "${var.service}"
  }
}
