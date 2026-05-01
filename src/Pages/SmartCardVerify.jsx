import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Spinner, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import PageTitle from '../Components/PageTitle';

const API_BASE = 'https://api.do360.com/api/one-club-memberships';
const API_TOKEN = import.meta.env.VITE_DO360_API_TOKEN;

const MEMBERSHIP_CLASS_COLORS = {
  Platinum: '#b0c0d0',
  Gold: '#d4a017',
  Silver: '#a8a8a8',
  Bronze: '#cd7f32',
};

const SmartCardVerify = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language?.startsWith('zh');

  const [membershipNumber, setMembershipNumber] = useState('');
  const [lookupStatus, setLookupStatus] = useState(null); // null | 'loading' | 'found' | 'not_found' | 'error'
  const [submitStatus, setSubmitStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [documentId, setDocumentId] = useState(null);

  const [formData, setFormData] = useState({
    LegalName: '',
    Name: '',
    Phone: '',
    Email: '',
  });

  const t = (zh, en) => (isZh ? zh : en);

  // ── Step 1: Look up member by MembershipNumber ────────────────────────────
  const handleLookup = async (e) => {
    e.preventDefault();
    if (!membershipNumber.trim()) return;

    setLookupStatus('loading');
    setSubmitStatus(null);
    setDocumentId(null);

    try {
      const params = new URLSearchParams({
        'filters[MembershipNumber][$eq]': membershipNumber.trim(),
      });
      const headers = { 'Content-Type': 'application/json' };
      if (API_TOKEN) headers['Authorization'] = `Bearer ${API_TOKEN}`;

      const res = await fetch(`${API_BASE}?${params}`, { headers });
      if (!res.ok) throw new Error('Network error');

      const json = await res.json();
      const record = json?.data?.[0];

      if (!record) {
        setLookupStatus('not_found');
        return;
      }

      setDocumentId(record.documentId);
      setFormData({
        LegalName: record.LegalName || '',
        Name: record.Name || '',
        Phone: record.Phone ? String(record.Phone) : '',
        Email: record.Email || '',
      });
      setLookupStatus('found');
    } catch {
      setLookupStatus('error');
    }
  };

  // ── Step 2: Submit updated member info ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documentId) return;

    setSubmitStatus('loading');

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (API_TOKEN) headers['Authorization'] = `Bearer ${API_TOKEN}`;

      const payload = {
        data: {
          LegalName: formData.LegalName.trim(),
          Name: formData.Name.trim(),
          Phone: formData.Phone.trim() || null,
          Email: formData.Email.trim() || null,
        },
      };

      const res = await fetch(`${API_BASE}/${documentId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Update failed');
      setSubmitStatus('success');
    } catch {
      setSubmitStatus('error');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setMembershipNumber('');
    setLookupStatus(null);
    setSubmitStatus(null);
    setDocumentId(null);
    setFormData({ LegalName: '', Name: '', Phone: '', Email: '' });
  };

  return (
    <div>
      <PageTitle pageTitle={t('360 智能卡实名认证', '360 Smart Card Verification')} />

      <Container style={{ maxWidth: 640, padding: '3rem 1.5rem' }}>
        {/* Header */}
        <div className="text-center mb-4">
          <div
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              borderRadius: 16,
              padding: '1.5rem 2.5rem',
              marginBottom: '1.5rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ color: '#c9a84c', fontSize: '0.75rem', letterSpacing: '0.15em', marginBottom: 4 }}>
              ECO LIVING ECOSYSTEM PASS
            </div>
            <div style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.08em' }}>
              360 SMART CARD
            </div>
            <div style={{ color: '#aaa', fontSize: '0.7rem', marginTop: 4, letterSpacing: '0.1em' }}>
              MEMBER · POINTS · ECOSYSTEM · BENEFITS
            </div>
          </div>

          <h4 style={{ fontWeight: 700, color: '#1a1a2e' }}>
            {t('会员实名认证', 'Member Identity Verification')}
          </h4>
          <p style={{ color: '#666', fontSize: '0.95rem' }}>
            {t(
              '请填写以下信息完成实名认证，完成后我们将优先为您匹配后续权益与使用安排。',
              'Please complete the fields below. Once submitted, we will prioritise matching your membership benefits and usage arrangements.',
            )}
          </p>
        </div>

        {/* ── Step 1: Membership Number Lookup ── */}
        <Card
          style={{
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
            marginBottom: '1.5rem',
          }}
        >
          <Card.Body style={{ padding: '1.5rem' }}>
            <h6 style={{ fontWeight: 600, marginBottom: '1rem', color: '#333' }}>
              {t('第一步：输入您的会员号', 'Step 1: Enter Your Membership Number')}
            </h6>
            <Form onSubmit={handleLookup}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: 500 }}>
                  {t('会员号', 'Membership Number')} <span style={{ color: 'red' }}>*</span>
                </Form.Label>
                <Row className="g-2">
                  <Col>
                    <Form.Control
                      type="text"
                      placeholder={t('请输入您的360智能卡会员号', 'Enter your 360 Smart Card number')}
                      value={membershipNumber}
                      onChange={(e) => setMembershipNumber(e.target.value)}
                      disabled={lookupStatus === 'loading' || lookupStatus === 'found'}
                      required
                      style={{ borderRadius: 8 }}
                    />
                  </Col>
                  <Col xs="auto">
                    {lookupStatus !== 'found' ? (
                      <Button
                        type="submit"
                        disabled={lookupStatus === 'loading' || !membershipNumber.trim()}
                        style={{
                          background: '#1a1a2e',
                          border: 'none',
                          borderRadius: 8,
                          padding: '0.375rem 1.25rem',
                        }}
                      >
                        {lookupStatus === 'loading' ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          t('验证', 'Verify')
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline-secondary"
                        onClick={handleReset}
                        style={{ borderRadius: 8 }}
                      >
                        {t('重置', 'Reset')}
                      </Button>
                    )}
                  </Col>
                </Row>
              </Form.Group>
            </Form>

            {/* Lookup feedback */}
            {lookupStatus === 'not_found' && (
              <Alert variant="danger" style={{ borderRadius: 8, marginBottom: 0 }}>
                <i className="bi bi-exclamation-circle me-2" />
                {t(
                  '会员号不符，请检查您的360智能卡或联系我们的客服。',
                  'Membership number not found. Please check your 360 Smart Card or contact our support team.',
                )}
              </Alert>
            )}
            {lookupStatus === 'error' && (
              <Alert variant="warning" style={{ borderRadius: 8, marginBottom: 0 }}>
                <i className="bi bi-wifi-off me-2" />
                {t('网络错误，请稍后重试。', 'Network error. Please try again later.')}
              </Alert>
            )}
            {lookupStatus === 'found' && (
              <Alert variant="success" style={{ borderRadius: 8, marginBottom: 0 }}>
                <i className="bi bi-patch-check me-2" />
                {t('会员号已验证，请继续填写以下信息。', 'Membership number verified. Please complete the information below.')}
              </Alert>
            )}
          </Card.Body>
        </Card>

        {/* ── Step 2: Update Info Form (shown only after successful lookup) ── */}
        {lookupStatus === 'found' && (
          <Card
            style={{
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
            }}
          >
            <Card.Body style={{ padding: '1.5rem' }}>
              <h6 style={{ fontWeight: 600, marginBottom: '1rem', color: '#333' }}>
                {t('第二步：完善您的认证信息', 'Step 2: Complete Your Verification Details')}
              </h6>

              {submitStatus === 'success' ? (
                <Alert variant="success" style={{ borderRadius: 8 }}>
                  <i className="bi bi-check-circle-fill me-2" />
                  <strong>{t('提交成功！', 'Submitted successfully!')}</strong>
                  <br />
                  {t(
                    '感谢您的认证。我们将优先为您匹配后续权益与使用安排，请留意我们的后续通知。',
                    'Thank you for completing your verification. We will prioritise matching your membership benefits and usage arrangements. Please look out for further communication from us.',
                  )}
                </Alert>
              ) : (
                <Form onSubmit={handleSubmit}>
                  {/* Legal Name */}
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 500 }}>
                      {t('法定姓名', 'Legal Name')}{' '}
                      <span style={{ color: 'red' }}>*</span>
                      <small style={{ color: '#888', fontWeight: 400, marginLeft: 6 }}>
                        {t('（与证件一致）', '(as shown on your ID document)')}
                      </small>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="LegalName"
                      value={formData.LegalName}
                      onChange={handleFormChange}
                      placeholder={t('请输入证件上的法定姓名', 'Enter your legal name as on your ID')}
                      required
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Group>

                  {/* Display Name on Card */}
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 500 }}>
                      {t('360智能卡显示姓名', 'Name on 360 Smart Card')}{' '}
                      <span style={{ color: 'red' }}>*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="Name"
                      value={formData.Name}
                      onChange={handleFormChange}
                      placeholder={t('请输入您希望在智能卡上显示的姓名', 'Enter the name to display on your Smart Card')}
                      required
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Group>

                  {/* Phone */}
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: 500 }}>
                      {t('电话', 'Phone Number')}
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      name="Phone"
                      value={formData.Phone}
                      onChange={handleFormChange}
                      placeholder={t('请输入联系电话', 'Enter your phone number')}
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Group>

                  {/* Email */}
                  <Form.Group className="mb-4">
                    <Form.Label style={{ fontWeight: 500 }}>
                      {t('电子邮箱', 'Email Address')}
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="Email"
                      value={formData.Email}
                      onChange={handleFormChange}
                      placeholder={t('请输入电子邮箱', 'Enter your email address')}
                      style={{ borderRadius: 8 }}
                    />
                  </Form.Group>

                  {submitStatus === 'error' && (
                    <Alert variant="danger" style={{ borderRadius: 8 }}>
                      <i className="bi bi-exclamation-triangle me-2" />
                      {t('提交失败，请稍后重试或联系客服。', 'Submission failed. Please try again later or contact support.')}
                    </Alert>
                  )}

                  <div className="d-grid">
                    <Button
                      type="submit"
                      disabled={
                        submitStatus === 'loading' ||
                        !formData.LegalName.trim() ||
                        !formData.Name.trim()
                      }
                      style={{
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
                        border: 'none',
                        borderRadius: 8,
                        padding: '0.65rem',
                        fontWeight: 600,
                        fontSize: '1rem',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {submitStatus === 'loading' ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" />
                          {t('提交中...', 'Submitting...')}
                        </>
                      ) : (
                        t('提交认证信息', 'Submit Verification')
                      )}
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Privacy note */}
        <p
          style={{
            fontSize: '0.78rem',
            color: '#aaa',
            textAlign: 'center',
            marginTop: '1.5rem',
          }}
        >
          {t(
            '您的个人信息仅用于360智能卡会员权益匹配，受到严格保护。',
            'Your personal information is used solely for 360 Smart Card membership benefit matching and is strictly protected.',
          )}
        </p>
      </Container>
    </div>
  );
};

export default SmartCardVerify;
