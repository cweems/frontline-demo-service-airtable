require('dotenv').config();

const _ = (varName, defaults) => process.env[varName] || defaults || null;

const port = _('PORT', 5000);

module.exports = {
    port: process.env.PORT || port,
    twilio: {
        account_sid: _('TWILIO_ACCOUNT_SID'),
        auth_token: _('TWILIO_AUTH_TOKEN'),
        sso_realm_sid: _('TWILIO_SSO_REALM_SID'),
        sms_number: _('TWILIO_SMS_NUMBER'),
        whatsapp_number: _('TWILIO_WHATSAPP_NUMBER'),
        airtable_api_key: _('AIRTABLE_API_KEY'),
        airtable_base_id: _('AIRTABLE_BASE_ID'),
        airtable_table_name: _('AIRTABLE_TABLE_NAME')
    },
};
