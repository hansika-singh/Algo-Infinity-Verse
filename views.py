from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from .models import LessonProgress
from .serializers import DailyProgressSerializer

class DailyLessonStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=30)

        daily_data = (
            LessonProgress.objects.filter(
                user=user,
                completed=True,
                updated_at__date__gte=start_date,
                updated_at__date__lte=end_date
            )
            .values('updated_at__date')
            .annotate(count=Count('id'))
            .order_by('updated_at__date')
        )

        # Get lesson titles for each day
        result = []
        for entry in daily_data:
            lessons = LessonProgress.objects.filter(
                user=user,
                completed=True,
                updated_at__date=entry['updated_at__date']
            ).values_list('lesson__title', flat=True)

            result.append({
                'date': entry['updated_at__date'],
                'count': entry['count'],
                'lessons': list(lessons)
            })

        serializer = DailyProgressSerializer(result, many=True)
        return Response(serializer.data)