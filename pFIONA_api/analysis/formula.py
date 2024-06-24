import numpy as np


def absorbance(ref_scan, dark_scan, sample_scan):
    """
    Compute the absorbance of a scan.

    :param ref_scan: list of reference scan
    :param dark_scan: list of dark scan
    :param sample_scan: list of sample scan

    :return: list of absorbance
    """

    ref_scan = np.array(ref_scan)
    dark_scan = np.array(dark_scan)
    sample_scan = np.array(sample_scan)

    with np.errstate(divide='ignore', invalid='ignore'):
        absorbance_values = np.log10((ref_scan - dark_scan) / (sample_scan - dark_scan))
        absorbance_values[np.isnan(absorbance_values)] = 0  # Replace NaNs with 0 or another appropriate value

    # Remplacer les valeurs infinies par le minimum des valeurs d'absorbance
    finite_absorbance_values = absorbance_values[np.isfinite(absorbance_values)]
    if finite_absorbance_values.size > 0:
        min_absorbance = finite_absorbance_values.min()
        absorbance_values[np.isinf(absorbance_values)] = min_absorbance
    else:
        absorbance_values[np.isinf(absorbance_values)] = 0

    return absorbance_values.tolist()


def concentration(abs_sample, abs_blank, abs_standard, std_conc):
    print('CALCUL')
    print(f"abs_sample: {abs_sample}")
    print(f"abs_blank: {abs_blank}")
    print(f"abs_standard: {abs_standard}")
    print(f"std_conc: {std_conc}")
    return ((abs_sample - abs_blank) * std_conc) / (abs_standard - abs_blank)
