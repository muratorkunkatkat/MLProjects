import pandas as pd
import numpy as np
from scipy.stats import t
import os
from datetime import datetime, timedelta

input_folder = "."
output_folder = os.path.join(input_folder, "risk_outputs")

ilceler = [
    "BÜYÜKORHAN", "GEMLİK", "GÜRSU", "HARMANCIK", "KARACABEY", "KELES",
    "KESTEL", "MUDANYA", "MUSTAFAKEMALPAŞA", "NİLÜFER", "ORHANELİ",
    "ORHANGAZİ", "OSMANGAZİ", "YENİŞEHİR", "YILDIRIM", "İNEGÖL", "İZNİK"
]


def normalize_name(name):
    if not isinstance(name, str): return ""

    mapping = {
        'İ': 'i', 'I': 'i', 'Ş': 's', 'Ğ': 'g', 'Ü': 'u', 'Ö': 'o', 'Ç': 'c',
        ' ': ''
    }
    clean_name = ""
    for char in name:
        if char in mapping:
            clean_name += mapping[char]
        else:
            clean_name += char

    return clean_name.lower().strip()


def calculate_prob(prediction, limit, diff_data):
    diff_data = diff_data[~np.isnan(diff_data)]
    if len(diff_data) < 3: return None

    df_day, loc, scale = t.fit(diff_data, floc=0)

    diff_needed = limit - prediction
    prob = t.cdf(diff_needed, df_day, loc, scale)
    return prob


def get_limit_temperature(fruit, date, severity):
    md = (date.month, date.day)

    if severity == "10percent":
        
        if fruit == "peach":
            if (2, 20) <= md <= (3, 5): return -7.7
            if (3, 6) <= md <= (3, 15): return -6.1
            if (3, 16) <= md <= (3, 22): return -5.0
            if (3, 23) <= md <= (3, 30): return -3.8
            if (3, 31) <= md <= (4, 4): return -3.3
            if (4, 5) <= md <= (4, 12): return -2.7
            if (4, 13) <= md <= (4, 25): return -2.2
            return -15.0

        if fruit == "plum":
            if (3, 1) <= md <= (3, 10): return -2.8
            if (3, 11) <= md <= (3, 20): return -2.8
            if (3, 21) <= md <= (4, 15): return -1.1
            return -18.0
            
        return 0

    if severity == "90percent":
        
        if fruit == "peach":
            if (2, 20) <= md <= (3, 5): return -17.2
            if (3, 6) <= md <= (3, 15): return -15.0
            if (3, 16) <= md <= (3, 22): return -12.7
            if (3, 23) <= md <= (3, 30): return -9.4
            if (3, 31) <= md <= (4, 4): return -6.1
            if (4, 5) <= md <= (4, 12): return -4.4
            if (4, 13) <= md <= (4, 25): return -3.8
            return -20.0

        if fruit == "plum":
            if (3, 1) <= md <= (3, 10): return -5.0
            if (3, 11) <= md <= (3, 20): return -5.0
            if (3, 21) <= md <= (4, 15): return -4.5
            return -25.0
            

        return -2

    return 10


fruits = ["peach", "plum"]
severities = ["10percent", "90percent"]

for fruit in fruits:
    for severity in severities:
        output_csv = os.path.join(output_folder, f"risk_outputs_{fruit}_{severity}.csv")
        output_csvt = os.path.join(output_folder, f"risk_outputs_{fruit}_{severity}.csvt")

        results = []

        for ilce in ilceler:
            norm_name = normalize_name(ilce)
            file_name = f"prediction-{norm_name}.csv"
            file_path = os.path.join(input_folder, file_name)

            if not os.path.exists(file_path):
                if "mustafa" in norm_name:
                    alt_name = norm_name.replace("mustafa", "mustfa")
                    alt_path = os.path.join(input_folder, f"prediction-{alt_name}.csv")
                    if os.path.exists(alt_path):
                        file_path = alt_path
                        file_name = f"prediction-{alt_name}.csv"

            row_data = {'AD': ilce}

            if not os.path.exists(file_path):
                print(f"NOT FOUND: {file_name} ({ilce})")
                for i in range(1, 5): row_data[f'min{i}'] = None
                results.append(row_data)
                continue

            try:
                df = pd.read_csv(file_path)

                for day in range(1, 5):
                    target_min = f"min{day}"
                    target_max = f"max{day}"
                    base_min = "min0"
                    base_max = "max0"

                    diff_min = df[target_min] - df[base_min]
                    diff_max = df[target_max] - df[base_max]

                    combined_diffs = pd.concat([diff_min, diff_max]).dropna()

                    valid_preds = df[df[target_min].notna()]

                    if valid_preds.empty:
                        row_data[f'min{day}'] = None
                    else:
                        current_pred = valid_preds.iloc[-1][target_min]

                        target_date = datetime.now() + timedelta(days=day)
                        limit_temperature = get_limit_temperature(fruit, target_date, severity)

                        prob = calculate_prob(current_pred, limit_temperature, combined_diffs)

                        if prob is not None:
                            row_data[f'min{day}'] = round(prob, 4)
                        else:
                            row_data[f'min{day}'] = None

                results.append(row_data)
                print(f"{ilce} DONE ({fruit} - {severity})")

            except Exception as e:
                print(f"ERROR {ilce} {e}")
                results.append(row_data)

        output_df = pd.DataFrame(results)
        output_df = output_df[['AD', 'min1', 'min2', 'min3', 'min4']]

        output_df.to_csv(output_csv, index=False, encoding='utf-8-sig')

        csvt_content = '"String","Real","Real","Real","Real"'

        with open(output_csvt, "w") as f:
            f.write(csvt_content)

        print(f"\nSaved csv file {output_csv}")
        print(f"Saved csvt file {output_csvt}")
        print(f"\n{output_df.head()}")