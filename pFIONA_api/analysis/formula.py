import numpy as np


def absorbance(ref_scan, dark_scan, sample_scan):
    """
    Compute the absorbance of a scan.

    :param ref_scan: list of reference scan
    :param dark_scan: list of dark scan
    :param sample_scan: list of sample scan

    :return: list of absorbance
    """
    # Convert the input lists to numpy arrays
    ref_scan = np.array(ref_scan)
    dark_scan = np.array(dark_scan)
    sample_scan = np.array(sample_scan)

    # Calculate absorbance values, ignoring divide and invalid warnings
    with np.errstate(divide='ignore', invalid='ignore'):
        absorbance_values = np.log10((ref_scan - dark_scan) / (sample_scan - dark_scan))
        # Replace NaNs with 0
        absorbance_values[np.isnan(absorbance_values)] = 0

    # Replace infinite values with the minimum absorbance value or 0 if no finite values exist
    finite_absorbance_values = absorbance_values[np.isfinite(absorbance_values)]
    if finite_absorbance_values.size > 0:
        min_absorbance = finite_absorbance_values.min()
        absorbance_values[np.isinf(absorbance_values)] = min_absorbance
    else:
        absorbance_values[np.isinf(absorbance_values)] = 0

    return absorbance_values.tolist()


def concentration(abs_sample, abs_blank, abs_standard, std_conc):
    """
    Compute the concentration of a sample.

    :param abs_sample: absorbance of the sample
    :param abs_blank: absorbance of the blank
    :param abs_standard: absorbance of the standard
    :param std_conc: concentration of the standard

    :return: concentration of the sample
    """
    return ((abs_sample - abs_blank) * std_conc) / (abs_standard - abs_blank)
