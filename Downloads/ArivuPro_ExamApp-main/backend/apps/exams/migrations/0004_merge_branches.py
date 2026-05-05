from django.db import migrations


class Migration(migrations.Migration):
    """Merge the two parallel migration branches that both stem from 0001_initial."""

    dependencies = [
        ('exams', '0003_alter_question_chapter'),
        ('exams', '0003_pdfdocument'),
    ]

    operations = []
