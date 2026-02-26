"""
Lambda handler for PDF report generation
"""
import json
import sys
import os
from io import BytesIO

# Add shared directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../shared'))

from bedrock_service import BedrockService
from dynamodb_service import DynamoDBService
from s3_service import S3Service
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT


def lambda_handler(event, context):
    """
    POST /report
    Generate PDF report for an assessment
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        assessment_id = body.get('assessment_id')
        
        if not assessment_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Missing assessment_id'
                })
            }
        
        # Initialize services
        dynamodb_service = DynamoDBService()
        bedrock_service = BedrockService()
        s3_service = S3Service()
        
        # Get assessment data
        print(f"Retrieving assessment: {assessment_id}")
        assessment_data = dynamodb_service.get_assessment(assessment_id)
        
        if not assessment_data:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Assessment not found'
                })
            }
        
        # Generate PDF
        print("Generating PDF report...")
        pdf_bytes = generate_pdf_report(assessment_data)
        
        # Upload to S3
        s3_key = s3_service.save_pdf(pdf_bytes, assessment_id)
        
        # Generate download URL
        download_url = s3_service.generate_download_url(s3_key)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'report_s3_url': download_url,
                's3_key': s3_key,
                'expires_in': 3600
            })
        }
        
    except Exception as e:
        print(f"Error in report handler: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'error': 'Failed to generate report',
                'message': str(e)
            })
        }


def generate_pdf_report(assessment_data: dict) -> bytes:
    """Generate PDF report using ReportLab"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a73e8'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1a73e8'),
        spaceAfter=12,
        spaceBefore=12
    )
    
    # Title
    story.append(Paragraph("AyushScan AI - Patient Referral Report", title_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Assessment ID and Timestamp
    story.append(Paragraph(f"<b>Assessment ID:</b> {assessment_data.get('assessment_id', 'N/A')}", styles['Normal']))
    story.append(Paragraph(f"<b>Date:</b> {assessment_data.get('timestamp', 'N/A')}", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Patient Information
    if assessment_data.get('patient_info'):
        story.append(Paragraph("Patient Information", heading_style))
        patient_info = assessment_data['patient_info']
        
        if patient_info.get('name'):
            story.append(Paragraph(f"<b>Name:</b> {patient_info['name']}", styles['Normal']))
        if patient_info.get('age'):
            story.append(Paragraph(f"<b>Age:</b> {patient_info['age']} years", styles['Normal']))
        if patient_info.get('gender'):
            story.append(Paragraph(f"<b>Gender:</b> {patient_info['gender'].capitalize()}", styles['Normal']))
        if patient_info.get('location'):
            story.append(Paragraph(f"<b>Location:</b> {patient_info['location']}", styles['Normal']))
        
        story.append(Spacer(1, 0.2*inch))
    
    # Symptoms
    story.append(Paragraph("Chief Complaint and Symptoms", heading_style))
    story.append(Paragraph(assessment_data.get('voice_transcript', 'No symptoms recorded'), styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    
    # Visual Findings
    if assessment_data.get('rekognition_labels'):
        story.append(Paragraph("Visual Findings", heading_style))
        labels = ", ".join(assessment_data['rekognition_labels'])
        story.append(Paragraph(f"Image analysis detected: {labels}", styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
    
    # Triage Assessment
    story.append(Paragraph("Triage Assessment", heading_style))
    
    triage_level = assessment_data.get('triage_level', 'UNKNOWN')
    color_map = {
        'GREEN': colors.green,
        'YELLOW': colors.yellow,
        'RED': colors.red
    }
    
    triage_color = color_map.get(triage_level, colors.grey)
    
    triage_data = [
        ['Triage Level', triage_level],
        ['Confidence', f"{assessment_data.get('confidence_score', 0) * 100:.1f}%"],
        ['Primary Concern', assessment_data.get('primary_concern', 'N/A')],
    ]
    
    triage_table = Table(triage_data, colWidths=[2*inch, 4*inch])
    triage_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (1, 0), (1, 0), triage_color),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(triage_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Symptoms Detected
    if assessment_data.get('symptoms_detected'):
        story.append(Paragraph("Symptoms Detected", heading_style))
        for symptom in assessment_data['symptoms_detected']:
            story.append(Paragraph(f"• {symptom}", styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
    
    # Recommended Action
    story.append(Paragraph("Recommended Action", heading_style))
    story.append(Paragraph(assessment_data.get('recommended_action', 'N/A'), styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    
    # Urgency Reason
    story.append(Paragraph("Clinical Reasoning", heading_style))
    story.append(Paragraph(assessment_data.get('urgency_reason', 'N/A'), styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    
    # Follow-up Questions
    if assessment_data.get('follow_up_questions'):
        story.append(Paragraph("Follow-up Questions for Doctor", heading_style))
        for question in assessment_data['follow_up_questions']:
            story.append(Paragraph(f"• {question}", styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
    
    # Footer
    story.append(Spacer(1, 0.5*inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER
    )
    story.append(Paragraph("This report was generated by AyushScan AI for ASHA workers in rural India.", footer_style))
    story.append(Paragraph("For medical professional review only. Not a substitute for clinical examination.", footer_style))
    
    # Build PDF
    doc.build(story)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes
