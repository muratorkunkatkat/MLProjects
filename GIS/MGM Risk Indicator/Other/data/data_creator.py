import pandas as pd
import os
import glob
from datetime import datetime, timedelta

SOURCE_FOLDER = "mgm-scrapper-main"
START_DATE_STR = "2026-01-06"
END_DATE_STR = "2026-04-01"

COLUMNS = [
    'date',
    'min0', 'min1', 'min2', 'min3', 'min4',
    'max0', 'max1', 'max2', 'max3', 'max4'
]


def get_english_filename(text):
    # Büyükorhan -> buyukorhan

    mapping = {
        'İ': 'i', 'I': 'i', 'ı': 'i',
        'Ş': 's', 'ş': 's',
        'Ğ': 'g', 'ğ': 'g',
        'Ü': 'u', 'ü': 'u',
        'Ö': 'o', 'ö': 'o',
        'Ç': 'c', 'ç': 'c'
    }

    for tr, en in mapping.items():
        text = text.replace(tr, en)

    return text.lower()


def main():
    start_date = datetime.strptime(START_DATE_STR, "%Y-%m-%d")
    end_date = datetime.strptime(END_DATE_STR, "%Y-%m-%d")

    date_range = []
    curr = start_date
    while curr <= end_date:
        date_range.append(curr)
        curr += timedelta(days=1)

    # storage[district_name_raw][target_date_object] = {'min0': val,...}
    storage = {}

    file_pattern = os.path.join(SOURCE_FOLDER, "bursa_5gun_*.xlsx")
    xlsx_files = glob.glob(file_pattern)

    print(f"Found {len(xlsx_files)} Excel files. Processing...")

    for file_path in xlsx_files:
        filename = os.path.basename(file_path)
        try:
            date_part = filename.replace("bursa_5gun_", "").replace(".xlsx", "")
            ref_date = datetime.strptime(date_part, "%Y-%m-%d")
        except ValueError:
            print(f"Skipping file with unexpected name format: {filename}")
            continue

        try:
            df = pd.read_excel(file_path)
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            continue

        unique_districts = df['ilce'].unique()

        for district in unique_districts:
            district_rows = df[df['ilce'] == district]

            district_rows = district_rows.reset_index(drop=True)

            if district not in storage:
                storage[district] = {}

            for i in range(5):
                if i >= len(district_rows):
                    break

                row = district_rows.iloc[i]

                # row 0 = ref_date + 0 days
                # row 1 = ref_date + 1 days
                target_date = ref_date + timedelta(days=i)

                if start_date <= target_date <= end_date:
                    if target_date not in storage[district]:
                        storage[district][target_date] = {}

                    storage[district][target_date][f'min{i}'] = row['sicaklik_en_dusuk']
                    storage[district][target_date][f'max{i}'] = row['sicaklik_en_yuksek']

    print("Generating CSV files")

    if not storage:
        print("No data found or processed. Check folder path and file names.")
        return

    for district, date_data in storage.items():
        csv_rows = []

        for d in date_range:
            row_dict = {'date': d.strftime("%d.%m.%Y")}

            day_values = date_data.get(d, {})

            for i in range(5):
                row_dict[f'min{i}'] = day_values.get(f'min{i}', None)
                row_dict[f'max{i}'] = day_values.get(f'max{i}', None)

            csv_rows.append(row_dict)

        final_df = pd.DataFrame(csv_rows, columns=COLUMNS)

        clean_dist = get_english_filename(district)
        output_filename = f"prediction-{clean_dist}.csv"

        # Save
        final_df.to_csv(output_filename, index=False)
        print(f"Created: {output_filename}")


if __name__ == "__main__":
    main()