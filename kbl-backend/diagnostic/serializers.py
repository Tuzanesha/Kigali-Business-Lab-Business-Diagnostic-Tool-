from rest_framework import serializers

from .models import Category, Question, Enterprise, QuestionResponse, ScoreSummary, Attachment, EmailOTP, ActionItem, TeamMember, NotificationPreference


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
            'location': {'required': False, 'allow_blank': True},
            'contact_person': {'required': False, 'allow_blank': True},
            'phone_number': {'required': False, 'allow_blank': True},
            'email': {'required': False, 'allow_blank': True},
            'year_founded': {'required': False, 'allow_null': True},
            'legal_structure': {'required': False, 'allow_blank': True},
            'owner_background': {'required': False, 'allow_blank': True},
            'description': {'required': False, 'allow_blank': True},
            'key_partners': {'required': False, 'allow_blank': True},
            'full_time_employees_total': {'required': False},
            'full_time_employees_female': {'required': False},
            'part_time_employees_total': {'required': False},
            'part_time_employees_female': {'required': False},
            'revenue_this_year': {'required': False, 'allow_null': True},
            'revenue_last_year': {'required': False, 'allow_null': True},
            'units_sold_this_year': {'required': False, 'allow_blank': True},
            'units_sold_last_year': {'required': False, 'allow_blank': True},
            'num_suppliers': {'required': False},
            'num_customers': {'required': False},
            'total_funding': {'required': False, 'allow_null': True},
            'short_term_plans': {'required': False, 'allow_blank': True},
            'medium_term_plans': {'required': False, 'allow_blank': True},
            'long_term_plans': {'required': False, 'allow_blank': True},
            'market_linkage_needs': {'required': False, 'allow_blank': True},
            'finance_needs_amount': {'required': False, 'allow_null': True},
            'key_assistance_areas': {'required': False, 'allow_blank': True},
            'status': {'required': False, 'allow_blank': True},
        }

    def validate(self, attrs):
        # Conditional, non-strict validation: only check fields if provided
        numeric_fields = [
            'full_time_employees_total', 'full_time_employees_female',
            'part_time_employees_total', 'part_time_employees_female',
            'num_suppliers', 'num_customers',
        ]
        for f in numeric_fields:
            v = attrs.get(f)
            if v is not None and v < 0:
                raise serializers.ValidationError({f: 'Must be a non-negative integer'})

        decimal_fields = ['revenue_this_year', 'revenue_last_year', 'total_funding', 'finance_needs_amount']
        for f in decimal_fields:
            v = attrs.get(f)
            if v is not None and v < 0:
                raise serializers.ValidationError({f: 'Must be a non-negative number'})

        year = attrs.get('year_founded')
        if year is not None:
            try:
                y = int(year)
            except Exception:
                raise serializers.ValidationError({'year_founded': 'Enter a valid year'})
            if not (1800 <= y <= 2100):
                raise serializers.ValidationError({'year_founded': 'Enter a valid year'})
        return attrs


class TeamMemberSerializer(serializers.ModelSerializer):
    # Use PrimaryKeyRelatedField with a default queryset that will be filtered in __init__
    enterprise = serializers.PrimaryKeyRelatedField(queryset=Enterprise.objects.all())
    
    class Meta:
        model = TeamMember
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'invitation_token', 'accepted_at', 'user', 'invited_by']
        extra_kwargs = {
            'email': { 'required': True },
            'role': { 'required': False },
            'status': { 'required': False },
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set the queryset for enterprise field dynamically based on authenticated user
        if self.context.get('request'):
            user = self.context['request'].user
            if user and user.is_authenticated:
                # Only allow enterprises owned by the current user
                self.fields['enterprise'].queryset = Enterprise.objects.filter(owner=user)
            else:
                # If no authenticated user, use empty queryset
                self.fields['enterprise'].queryset = Enterprise.objects.none()
        else:
            # If no request context, use all enterprises (fallback, shouldn't happen in normal flow)
            self.fields['enterprise'].queryset = Enterprise.objects.all()


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


class ActionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActionItem
        fields = [
            'id', 'owner', 'enterprise', 'title', 'description', 'source', 'priority', 'due_date',
            'assigned_to', 'assigned_to_user', 'status', 'order', 'progress_percentage',
            'completed_at', 'completed_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at', 'completed_at', 'completed_by']

