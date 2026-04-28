# Main Pipeline

# 1. User opens webpage
# 2. User clicks “Start voice intake”
# 3. Bot asks one field at a time
# 4. Bot saves each answer into structured form state
# 5. Bot validates important fields
# 6. Bot confirms sensitive fields
# 7. User sees review screen
# 8. User clicks “Submit”
# 9. App sends summary email
# 10. Confirmation message appears

# Email: must look like email
# Birthday: must parse to date
# Last four SSN: exactly 4 digits
# Routing number: exactly 9 digits
# Account number: digits, length flexible
# Account type: checking or savings
# State: normalize to two-letter abbreviation if possible
# Zip: 5 digits, optionally ZIP+4
# Phone: normalize to 10 digits if US
# Salary over 2000: yes/no
# Financial assistance: yes/no
# Deployed military: yes/no