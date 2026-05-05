from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserAdminSerializer(serializers.ModelSerializer):
    """Serializer for admin user management."""
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'password', 'is_active', 'date_joined', 'created_at',
            'exam_type', 'exam_level', 'institute', 'registration_number', 'phone'
        )
        read_only_fields = ('id', 'date_joined', 'created_at')

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
