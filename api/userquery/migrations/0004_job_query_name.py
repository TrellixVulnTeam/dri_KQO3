# -*- coding: utf-8 -*-
# Generated by Django 1.9.4 on 2017-12-11 03:20
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('userquery', '0003_auto_20171207_1547'),
    ]

    operations = [
        migrations.AddField(
            model_name='job',
            name='query_name',
            field=models.CharField(default='Unnamed', max_length=128, verbose_name='Original query name'),
        ),
    ]
