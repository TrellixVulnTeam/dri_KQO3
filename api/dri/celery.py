# from http://docs.celeryproject.org/en/latest/django
#      /first-steps-with-django.html#using-celery-with-django

from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from django.conf import settings

# set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dri.settings")

app = Celery('dri')

# Using a string here means the worker don't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
# app.config_from_object('django.conf:settings', namespace='CELERY')

app.conf.update(settings.CELERY)

app.autodiscover_tasks()

