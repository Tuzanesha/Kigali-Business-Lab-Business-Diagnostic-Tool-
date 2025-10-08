from rest_framework import serializers

from .models import Category, Question, Enterprise, QuestionResponse, ScoreSummary, Attachment, EmailOTP


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'weight', 'description', 'created_at', 'updated_at']


class QuestionSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())

    class Meta:
        model = Question
        fields = ['id', 'category', 'number', 'priority', 'text', 'descriptors', 'evidence_prompt', 'weight', 'created_at', 'updated_at']


class EnterpriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enterprise
        fields = '__all__'
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False},
            'location': {'required': True, 'allow_blank': False},
            'contact_person': {'required': True, 'allow_blank': False},
            'phone_number': {'required': True, 'allow_blank': False},
            'email': {'required': True, 'allow_blank': False},
            'year_founded': {'required': True, 'allow_null': False},
            'legal_structure': {'required': True, 'allow_blank': False},
            'owner_background': {'required': True, 'allow_blank': False},
            'description': {'required': True, 'allow_blank': False},
            'key_partners': {'required': True, 'allow_blank': False},
            'full_time_employees_total': {'required': True},
            'full_time_employees_female': {'required': True},
            'part_time_employees_total': {'required': True},
            'part_time_employees_female': {'required': True},
            'revenue_this_year': {'required': True, 'allow_null': False},
            'revenue_last_year': {'required': True, 'allow_null': False},
            'units_sold_this_year': {'required': True, 'allow_blank': False},
            'units_sold_last_year': {'required': True, 'allow_blank': False},
            'num_suppliers': {'required': True},
            'num_customers': {'required': True},
            'total_funding': {'required': True, 'allow_null': False},
            'short_term_plans': {'required': True, 'allow_blank': False},
            'medium_term_plans': {'required': True, 'allow_blank': False},
            'long_term_plans': {'required': True, 'allow_blank': False},
            'market_linkage_needs': {'required': True, 'allow_blank': False},
            'finance_needs_amount': {'required': True, 'allow_null': False},
            'key_assistance_areas': {'required': True, 'allow_blank': False},
            'status': {'required': True, 'allow_blank': False},
        }

    def validate(self, attrs):
        # numeric non-negative checks
        numeric_fields = [
            'full_time_employees_total', 'full_time_employees_female',
            'part_time_employees_total', 'part_time_employees_female',
            'num_suppliers', 'num_customers',
        ]
        for f in numeric_fields:
            v = attrs.get(f)
            if v is None or v < 0:
                raise serializers.ValidationError({f: 'Must be a non-negative integer'})

        decimal_fields = ['revenue_this_year', 'revenue_last_year', 'total_funding', 'finance_needs_amount']
        for f in decimal_fields:
            v = attrs.get(f)
            if v is None or v < 0:
                raise serializers.ValidationError({f: 'Must be a non-negative number'})

        year = attrs.get('year_founded')
        if not (1800 <= int(year) <= 2100):
            raise serializers.ValidationError({'year_founded': 'Enter a valid year'})
        return attrs


class QuestionResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionResponse
        fields = ['id', 'enterprise', 'question', 'score', 'evidence', 'comments', 'created_at', 'updated_at']

    def validate_score(self, value: int) -> int:
        if value == -1:
            return value
        if value not in {0, 1, 2, 3, 4}:
            raise serializers.ValidationError('Score must be -1 (NA) or integer 0..4')
        return value


class ScoreSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ScoreSummary
        fields = ['id', 'enterprise', 'overall_percentage', 'section_scores', 'priorities', 'calculated_at']


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'response', 'file', 'uploaded_at', 'created_at', 'updated_at']


class EmailOTPSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailOTP
        fields = ['id', 'user', 'code', 'expires_at', 'is_verified', 'created_at', 'updated_at']
        read_only_fields = ['user', 'is_verified', 'created_at', 'updated_at']


