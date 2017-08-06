data "aws_iam_policy_document" "deployment" {
  statement {
    actions = [
      "s3:GetBucketLocation",
      "s3:ListBucket",
    ]

    resources = [
      "${aws_s3_bucket.deployment.arn}",
    ]
  }

  statement {
    actions = [
      "s3:*",
    ]

    resources = [
      "${aws_s3_bucket.deployment.arn}/*",
    ]
  }

  statement {
    actions = [
      "cloudformation:*",
    ]

    resources = [
      "arn:aws:cloudformation:*:*:stack/${var.service}-${terraform.env}/*",
    ]
  }

  statement {
    actions = [
      "cloudformation:ValidateTemplate",
    ]

    resources = [
      "*",
    ]
  }

  statement {
    actions = [
      "iam:*",
    ]

    resources = [
      "arn:aws:iam::*:role/${var.service}-${terraform.env}-*-lambdaRole",
    ]
  }

  statement {
    actions = [
      "iam:*",
    ]

    resources = [
      "${aws_iam_role.runtime.arn}",
    ]
  }

  statement {
    actions = [
      "logs:DescribeLogGroups",
    ]

    resources = [
      "arn:aws:logs:*:*:log-group::log-stream:*",
    ]
  }

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
      "lambda:*",
    ]

    resources = [
      "arn:aws:lambda:*:*:function:${var.service}-${terraform.env}-*",
    ]
  }

  statement {
    actions = [
      "events:*",
    ]

    resources = [
      "arn:aws:events:*:*:rule/${var.service}-${terraform.env}-*",
    ]
  }
}

resource "aws_iam_user" "deployment" {
  name = "${var.service}-${terraform.env}-deployment"
}

resource "aws_iam_policy" "deployment" {
  name   = "${var.service}-${terraform.env}-deployment-access-policy"
  policy = "${data.aws_iam_policy_document.deployment.json}"
}

resource "aws_iam_policy_attachment" "deployment" {
  name       = "deployment"
  users      = ["${aws_iam_user.deployment.name}"]
  policy_arn = "${aws_iam_policy.deployment.arn}"
}
