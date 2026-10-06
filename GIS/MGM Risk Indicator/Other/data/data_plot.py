import pandas as pd
import numpy as np
from scipy.stats import t
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator
import os

input_folder = "."

ilceler = [
    "BÜYÜKORHAN", "GEMLİK", "GÜRSU", "HARMANCIK", "KARACABEY", "KELES",
    "KESTEL", "MUDANYA", "MUSTAFAKEMALPAŞA", "NİLÜFER", "ORHANELİ",
    "ORHANGAZİ", "OSMANGAZİ", "YENİŞEHİR", "YILDIRIM", "İNEGÖL", "İZNİK"
]


def normalize_name(name):
    if not isinstance(name, str): return ""
    mapping = {'İ': 'i', 'I': 'i', 'Ş': 's', 'Ğ': 'g', 'Ü': 'u', 'Ö': 'o', 'Ç': 'c', ' ': ''}
    clean_name = ""
    for char in name:
        if char in mapping:
            clean_name += mapping[char]
        else:
            clean_name += char
    return clean_name.lower().strip()


plt.style.use('dark_background')

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

    if not os.path.exists(file_path):
        print(f"Skipping {ilce}: File not found.")
        continue

    try:
        df = pd.read_csv(file_path)

        days = [1, 2, 3, 4]
        combined_diffs = {}

        for d in days:
            target_min = f"min{d}"
            target_max = f"max{d}"
            base_min = "min0"
            base_max = "max0"

            if target_min not in df.columns or base_min not in df.columns:
                combined_diffs[d] = np.array([])
                continue

            diff_min = df[target_min] - df[base_min]
            diff_max = df[target_max] - df[base_max]

            combined = pd.concat([diff_min, diff_max]).dropna()

            combined = combined[(combined >= -5) & (combined <= 5)]
            combined_diffs[d] = combined

        fig, axes = plt.subplots(1, 4, figsize=(20, 6), sharey=True)
        fig.suptitle(f'{ilce}', fontsize=18, color='white')

        x_vals = np.linspace(-6, 6, 500)

        for i, d in enumerate(days):
            ax = axes[i]
            data_points = combined_diffs[d]

            if len(data_points) < 3:
                ax.text(0, 0, "Insufficient Data", ha='center', color='white')
                ax.set_title(f'Day {d}', fontsize=14)
                continue

            ax.hist(data_points, bins=np.arange(-5.5, 6.5, 1), density=True,
                    color='#2e7d32', edgecolor='black', alpha=0.6, label='Data Hist')

            ax.set_title(f'Day {d}', fontsize=14)
            ax.set_xlim(-6, 6)
            ax.grid(axis='y', alpha=0.2)
            ax.xaxis.set_major_locator(MaxNLocator(integer=True))
            ax.axvline(0, color='white', linestyle=':', linewidth=1, alpha=0.5)
            ax.set_xlabel('Difference')

            df_t, loc_t, scale_t = t.fit(data_points, floc=0)
            if df_t < 1.5:
                df_t, loc_t, scale_t = t.fit(data_points, floc=0, fdf=4)

            pdf_t = t.pdf(x_vals, df_t, loc_t, scale_t)
            ax.plot(x_vals, pdf_t, 'cyan', lw=2, label=f'T (df={df_t:.1f})')

            if i == 0:
                ax.set_ylabel('Probability Density')
                ax.legend(loc='upper right', fontsize='small')
            else:
                ax.legend(loc='upper right', fontsize='x-small')

        plt.tight_layout()
        plt.subplots_adjust(top=0.85)
        
        # Create output directory if it doesn't exist yet
        os.makedirs("plots", exist_ok=True)
        
        # Save the plot directly into the folder and close the figure context
        plt.savefig(f"plots/{norm_name}_distribution.png", dpi=150)
        plt.close(fig)

        print(f"{'Day':<5}{'Distribution':<15}{'StDev':<15}{'Scale':<15}")

        for d in days:
            data_points = combined_diffs[d]
            if len(data_points) > 2:
                df_t, loc_t, scale_t = t.fit(data_points, floc=0)
                if df_t < 1.5:
                    df_t, loc_t, scale_t = t.fit(data_points, floc=0, fdf=4)

                stdev_t = t.std(df_t, loc=loc_t, scale=scale_t)
                print(f"{d:<5}{'T':<15}{stdev_t:.4f}{scale_t:.4f}")
        print("\n")

    except Exception as e:
        print(f"ERROR processing {ilce}: {e}")
