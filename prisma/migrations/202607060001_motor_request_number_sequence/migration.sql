CREATE SEQUENCE IF NOT EXISTS "motor_request_number_seq"
  AS BIGINT
  INCREMENT BY 1
  MINVALUE 1
  START WITH 1
  NO CYCLE
  CACHE 1;

DO $$
DECLARE
  existing_max bigint;
  seq_last bigint;
  seq_called boolean;
  allocated_max bigint;
  target_value bigint;
BEGIN
  SELECT COALESCE(MAX((substring("requestNumber" FROM '^MTR-REQ-[0-9]{4}-([0-9]+)$'))::bigint), 0)
  INTO existing_max
  FROM "MotorInsuranceRequest";

  SELECT last_value, is_called
  INTO seq_last, seq_called
  FROM "motor_request_number_seq";

  allocated_max := CASE WHEN seq_called THEN seq_last ELSE seq_last - 1 END;
  target_value := GREATEST(existing_max, allocated_max, 1);

  PERFORM setval(
    '"motor_request_number_seq"',
    target_value,
    GREATEST(existing_max, allocated_max, 0) > 0
  );
END $$;
