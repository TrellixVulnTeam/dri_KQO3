# Generated by Django 2.2.17 on 2021-04-19 21:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('coadd', '0003_auto_20190201_1244'),
    ]

    operations = [
        migrations.AddField(
            model_name='release',
            name='rls_disabled',
            field=models.BooleanField(default=False, help_text='Mark this release as Disabled so that the interfaces cant select this release.', verbose_name='Disabled'),
        ),
    ]
