data "aws_iam_policy_document" "runtime" {
  statement {
    actions = [
      "logs:*",
    ]

    resources = [
      "arn:aws:logs:*:*:log-group:/aws/lambda/${var.service}-${terraform.env}-*:*",
    ]
  }

  statement {
    actions = [
      "kms:Decrypt",
    ]

    resources = [
      "${aws_kms_key.env_vars.arn}",
    ]
  }
}

resource "aws_iam_policy" "runtime" {
  name   = "${var.service}-${terraform.env}-runtime-access-policy"
  policy = "${data.aws_iam_policy_document.runtime.json}"
}

data "aws_iam_policy_document" "assume_runtime_role" {
  statement {
    actions = [
      "sts:AssumeRole",
    ]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "runtime" {
  name               = "${var.service}-${terraform.env}-runtime"
  assume_role_policy = "${data.aws_iam_policy_document.assume_runtime_role.json}"
}

resource "aws_iam_policy_attachment" "runtime" {
  name = "runtime"

  roles = [
    "${aws_iam_role.runtime.name}",
  ]

  policy_arn = "${aws_iam_policy.runtime.arn}"
}
