-- ============================================================================
-- GANESH UTSAV DONATIONS IMPORT SCRIPT
-- BPS Twin Towers PWA
-- Includes automatic lookup of flat_id by flat_number (e.g. 'B901', 'A1010')
-- Splits Row 55 (Jangid Families) equally into 5 flat entries:
-- B1802, B1707, B1807, B1107, B707 (₹2,222.20 each)
-- ============================================================================

DO $$
DECLARE
    v_campaign_id UUID;
BEGIN
    -- 1. Ensure the 'Ganesh Utsav' Campaign exists and is Active
    SELECT id INTO v_campaign_id 
    FROM donation_campaigns 
    WHERE title ILIKE '%Ganesh Utsav%' 
    LIMIT 1;

    IF v_campaign_id IS NULL THEN
        INSERT INTO donation_campaigns (
            title,
            description,
            category,
            target_amount,
            start_date,
            status
        ) VALUES (
            'Ganesh Utsav',
            'Community contributions and donations for Ganesh Utsav Festival celebrations.',
            'Festival',
            200000,
            CURRENT_DATE,
            'Active'
        )
        RETURNING id INTO v_campaign_id;
    END IF;

    -- 2. Temporary staging table for 100 entries (95 standard + 5 split flats for Jangid Families)
    CREATE TEMP TABLE tmp_donations (
        donor_name TEXT,
        flat_number TEXT,
        amount NUMERIC(10,2),
        payment_method TEXT DEFAULT 'UPI',
        notes TEXT DEFAULT 'Ganesh Utsav Contribution'
    ) ON COMMIT DROP;

    INSERT INTO tmp_donations (donor_name, flat_number, amount, payment_method, notes) VALUES
    ('Karthik Behera', 'B901', 5000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Noor Basha', 'A1010', 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('T D Sravan Kumar', 'B1106', 2151.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Palle Satyanarayana', 'B809', 2223.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Dr Mir Suhail', 'B501', 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('GV Srinivas Rao', 'A1102', 2001.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Radha kishan', 'A602', 2116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('KVS Ravi Kumar', 'A411', 5116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Nandita Supantha Chaudhuri', 'A502', 2511.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('T V Rao', 'A810', 999.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('B Lalit Kumar', 'B708', 1100.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('C Venkateshwar Rao', 'A1007', 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Apala Anand', 'B1506', 1001.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Y Ashok Babu', 'B1904', 2116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('K V K Raja Shekhar', 'A302', 2116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('A Agasthya Rao', 'A2007', 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Prem Prakash Verma', 'A1005', 2100.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Anitha Rajashekar (Cash)', 'B502', 2100.00, 'Cash', 'Ganesh Utsav Contribution'),
    ('Ramesh & Sushmita', 'A607', 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Hema Sangamkar', 'B1505', 2116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Anjana Satya Priya', 'B601', 2116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Bhaskar K', 'B1502', 2000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Mohammed Mashiuddin', 'A2008', 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Comsempet Srinivas', 'B1006', 2259.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Amit Kumar Verma', 'A1301', 1601.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Mohana Krishna', 'A1503', 1001.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('P Vishnu Vardhan', 'A1111', 2516.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('T Bharat Bhushan', 'B1906', 1600.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Shaik Mahaboob Subhani', 'A1011', 1116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Narayana Venu Gopal', 'A1409', 1409.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Ashwin Kumar', 'B608', 5001.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Kavya/ Harish Reddy', 'B804', 3116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Chandra Shekhar Maheshwari', 'B402', 2100.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Dr Praneeth Reddy', 'A508', 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Deepak Srivastava/ Manjari', 'B1811', 2100.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Vijay/ Deepika Mallgi', 'B308', 1100.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Vinay Kumar Bang', 'A1903', 2100.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Ch Balraj Chakaraharty', 'B801', 2516.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Praveen Lagishetty', 'B506', 1500.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Abrar', 'B1504', 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Bharath Bhushan D', 'B609', 2100.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Pandu Prajapati', 'A1008', 1111.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('KV Sasikanth', 'A301', 2116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Rajesh Bihani', 'B401', 2101.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Manikandan M', 'A811', 2101.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Narender Rao Deshmukh', 'B1909', 1500.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('K Vidyasavathi/ P Prathap', 'B309', 1116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Dr Srikar/ Sai Shreya', 'B1103', 1116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Vidwan/ Rohini', 'A611', 2000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Shakir Ahmed', 'B910', 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Dr Priya', 'B904', 1500.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('RAJEEV KUMAR SHARMA', 'B802', 1100.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Rejani', 'B1104', 1116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Jagadish', 'B709', 2001.00, 'UPI', 'Ganesh Utsav Contribution'),
    -- Row 55: Jangid Families (Total ₹11,111 split across 5 flats @ ₹2,222.20 each)
    ('Jangid Families', 'B1802', 2222.20, 'UPI', 'Ganesh Utsav Contribution (Flat 1 of 5)'),
    ('Jangid Families', 'B1707', 2222.20, 'UPI', 'Ganesh Utsav Contribution (Flat 2 of 5)'),
    ('Jangid Families', 'B1807', 2222.20, 'UPI', 'Ganesh Utsav Contribution (Flat 3 of 5)'),
    ('Jangid Families', 'B1107', 2222.20, 'UPI', 'Ganesh Utsav Contribution (Flat 4 of 5)'),
    ('Jangid Families', 'B707', 2222.20, 'UPI', 'Ganesh Utsav Contribution (Flat 5 of 5)'),
    -- Continued
    ('G Sandeep', 'A401', 2000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Pradeep Kumar Rout', 'B1804', 5111.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Shaik Rafee', NULL, 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Ankit Lat', 'B1309', 2100.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Bapi Raju Andey', NULL, 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Manoj', 'B510', 2116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Koluguru Rajani', 'B706', 3000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('P Rajashekhar', 'A802', 5116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Sreeramulu Basapogu', 'B1602', 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Sabitha / Sekhar', 'B410', 1116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('T Sulochan', 'B1609', 1001.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Suresh', 'A711', 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Samrat/ Salini', 'B1606', 1116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Rekha Satish', NULL, 1116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Ashutosh Hiral', 'B1402', 1100.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('P Sridhar', 'B1409', 5116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Saileela/ Raghu', 'A1101', 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Pandiri Deepak', 'A1505', 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Lakshmi Chandrakala', 'B1709', 1116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Valige Krishna Murthy', 'A1705', 2501.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Volam Sainath', 'A1003', 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Kamireddy HariPrasad', 'A701', 1116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('N Waseem Ahmed', 'A604', 1116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Dr Altaf', 'A1810', 1001.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Sunil Kumar Pakanati', 'B1801', 2116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Ramakanth Reddy Allu', NULL, 1116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Dr Pullaparaju', 'A2010', 2116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('S Nagarjuna', NULL, 1001.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Padamati Ravikanth Reddy', NULL, 1501.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Sathineni Pushpalatha', NULL, 2116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Kore Shruthi', NULL, 1500.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Nagaraju/ Deepa', 'B1004', 1116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('SV Krishna Reddy', 'B403', 1116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Ravishankar Reddy', 'B1009', 1000.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Chinni Gupta', 'B404', 1516.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Dr. Sri Priya Rasthapuram', 'A1610', 2116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Rajitha Santhosh Kotagiri', 'B1202', 1116.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Gayatri Yadav', NULL, 1001.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Kongara Sunitha', NULL, 2001.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Shivam Srivastava', 'A704', 1001.00, 'UPI', 'Ganesh Utsav Contribution'),
    ('Naresh Reddy', 'B2102', 5116.00, 'UPI', 'Ganesh Utsav Contribution');

    -- 3. Insert into public.donations table, joining with flats to resolve flat_id
    INSERT INTO donations (
        campaign_id,
        flat_id,
        donor_name,
        amount,
        payment_method,
        status,
        notes,
        donated_at
    )
    SELECT
        v_campaign_id,
        f.id AS flat_id,
        t.donor_name,
        t.amount,
        t.payment_method,
        'Verified' AS status,
        t.notes,
        NOW() AS donated_at
    FROM tmp_donations t
    LEFT JOIN flats f ON (
        UPPER(TRIM(f.flat_number)) = UPPER(TRIM(t.flat_number))
        OR UPPER(REPLACE(f.flat_number, '-', '')) = UPPER(REPLACE(t.flat_number, '-', ''))
    );

    RAISE NOTICE 'Successfully imported Ganesh Utsav donations with Jangid Families flat split.';
END $$;
