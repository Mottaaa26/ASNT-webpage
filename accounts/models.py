from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

# Create your models here.
class CustomUserManager(BaseUserManager):

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El usuario debe tener un email')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_super_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)
    

class CustomUser(AbstractBaseUser, PermissionsMixin):

    first_name = models.CharField(max_length=40, unique=False, blank=False, null=False)
    last_name = models.CharField(max_length=40, unique=False, blank=False, null=False)
    email = models.EmailField(max_length=40, unique=True, blank=False, null=False)
    photo = models.ImageField(upload_to='accounts/profile_photos/', null=True, blank=True)
    password = models.CharField(max_length=20, unique=False, blank=False, null=False)
    country = models.CharField(max_length=40, unique=False, blank=False, null=True)
    city = models.CharField(max_length=50, unique=False, blank=False, null=True)
    birth_day = models.DateTimeField(null=True, blank=False)
    subscription = models.BooleanField(verbose_name="Premium")

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"



        

