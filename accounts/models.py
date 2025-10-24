from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class CustomUser(AbstractUser):
    first_name = models.CharField(max_length=40, unique=False, blank=False, null=False)
    last_name = models.CharField(max_length=40, unique=False, blank=False, null=False)
    email = models.EmailField(unique=True, blank=False, null=False)
    photo = models.ImageField(upload_to='accounts/profile_photos/', null=True, blank=True)
    phone_number = models.CharField(max_length=14, null=True, blank=True)
    user_age = models.PositiveSmallIntegerField(blank=False, null=False)
    subscription = models.BooleanField(verbose_name="Premium")

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
        

