-- Fills the search text of every Part stored before the column existed, the
-- way the Store writes it: the name, the manufacturer and the part numbers,
-- separated by spaces, in lower case.
UPDATE "part"
SET "search_text" = lower(
  concat_ws(' ', "name", "manufacturer", NULLIF(array_to_string("part_numbers", ' '), ''))
)
WHERE "search_text" = '';
