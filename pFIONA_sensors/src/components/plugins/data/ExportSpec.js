import React, { useEffect, useState } from 'react';
import { TailSpin } from 'react-loader-spinner';

function ExportSpec() {
    const [deploymentData, setDeploymentData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [exportingRawCsv, setExportingRawCsv] = useState(null);
    const [exportingRawJson, setExportingRawJson] = useState(null);
    const [exportingAbsorbanceCsv, setExportingAbsorbanceCsv] = useState(null);
    const [exportingAbsorbanceJson, setExportingAbsorbanceJson] = useState(null);
    const [exportingConcentrationCsv, setExportingConcentrationCsv] = useState(null);
    const [exportingConcentrationJson, setExportingConcentrationJson] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => {
        fetch(`/api/get_deployment_list?sensor_id=${sensor_id}`)
            .then(response => response.json())
            .then(data => {
                setDeploymentData(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching data:", error);
                setLoading(false);
            });
    }, []);

    const handleExportRawData = (deploymentId, startTime, endTime) => {
        setExporting(true);
        setExportingRawJson(deploymentId);
        const avgTimestamp = Math.floor((startTime + endTime) / 2);
        const url = `/api/get_spectrums_in_deployment_full_info?sensor_id=${sensor_id}&timestamp=${avgTimestamp}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const jsonStr = JSON.stringify(data);
                const blob = new Blob([jsonStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `spectrum_data_${avgTimestamp}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setExportingRawJson(null);
                setExporting(false);
            })
            .catch(error => {
                console.error("Error exporting data:", error);
                setExportingRawJson(null);
                setExporting(false);
            });
    };

    const handleExportRawCsvData = (deploymentId, startTime, endTime) => {
        setExporting(true);
        setExportingRawCsv(deploymentId);
        const avgTimestamp = Math.floor((startTime + endTime) / 2);
        const url = `/api/export_raw_spectra_csv?timestamp=${avgTimestamp}&sensor_id=${sensor_id}`;

        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `spectrum_data_${avgTimestamp}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setExportingRawCsv(null);
                setExporting(false);
            })
            .catch(error => {
                console.error("Error exporting data:", error);
                setExportingRawCsv(null);
                setExporting(false);
            });
    };

    const handleExportAbsorbanceData = (deploymentId, startTime, endTime) => {
        setExporting(true);
        setExportingAbsorbanceJson(deploymentId);
        const avgTimestamp = Math.floor((startTime + endTime) / 2);
        const url = `/api/get_absorbance_spectrums_in_deployment_full_info?sensor_id=${sensor_id}&timestamp=${avgTimestamp}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const jsonStr = JSON.stringify(data);
                const blob = new Blob([jsonStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `absorbance_data_${avgTimestamp}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setExportingAbsorbanceJson(null);
                setExporting(false);
            })
            .catch(error => {
                console.error("Error exporting data:", error);
                setExportingAbsorbanceJson(null);
                setExporting(false);
            });
    };

    const handleExportAbsorbanceCsvData = (deploymentId, startTime, endTime) => {
        setExporting(true);
        setExportingAbsorbanceCsv(deploymentId);
        const avgTimestamp = Math.floor((startTime + endTime) / 2);
        const url = `/api/export_absorbance_spectra_csv?timestamp=${avgTimestamp}&sensor_id=${sensor_id}`;

        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `absorbance_data_${avgTimestamp}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setExportingAbsorbanceCsv(null);
                setExporting(false);
            })
            .catch(error => {
                console.error("Error exporting data:", error);
                setExportingAbsorbanceCsv(null);
                setExporting(false);
            });
    };

    // Function to handle exporting concentration data as JSON
    const handleExportConcentrationData = (deploymentId, startTime, endTime) => {
        setExporting(true);
        setExportingConcentrationJson(deploymentId);
        const avgTimestamp = Math.floor((startTime + endTime) / 2);
        const url = `/api/get_concentration_for_deployment?sensor_id=${sensor_id}&timestamp=${avgTimestamp}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const jsonStr = JSON.stringify(data);
                const blob = new Blob([jsonStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `concentration_data_${avgTimestamp}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setExportingConcentrationJson(null);
                setExporting(false);
            })
            .catch(error => {
                console.error("Error exporting data:", error);
                setExportingConcentrationJson(null);
                setExporting(false);
            });
    };

    // Function to handle exporting concentration data as CSV
    const handleExportConcentrationCsvData = (deploymentId, startTime, endTime) => {
        setExporting(true);
        setExportingConcentrationCsv(deploymentId);
        const avgTimestamp = Math.floor((startTime + endTime) / 2);
        const url = `/api/export_concentration_csv?timestamp=${avgTimestamp}&sensor_id=${sensor_id}`;

        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `concentration_data_${avgTimestamp}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setExportingConcentrationCsv(null);
                setExporting(false);
            })
            .catch(error => {
                console.error("Error exporting data:", error);
                setExportingConcentrationCsv(null);
                setExporting(false);
            });
    };

    const handleDelete = (deploymentId) => {
        setConfirmDelete(deploymentId);
        setTimeout(() => {
            setConfirmDelete(null);
        }, 3000);
    };

    const confirmDeleteAction = (deploymentId) => {
        fetch(`/api/delete_spectrums?sensor_id=${sensorId}&deployment_id=${deploymentId}`, {
            method: 'DELETE',
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    setDeploymentData(prevData => prevData.filter(deployment => deployment.deployment !== deploymentId));
                } else {
                    console.error("Error deleting data:", data.message);
                }
                setConfirmDelete(null);
            })
            .catch(error => {
                console.error("Error deleting data:", error);
                setConfirmDelete(null);
            });
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className={"w-full"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>EXPORT SPECTROPHOTOMETER</h2>
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8"}>
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="border border-custom-gray-1 bg-custom-gray-2">
                            <th className="font-montserrat font-medium pt-8 pb-2 pl-5 text-left">
                                Deployment ID
                            </th>
                            <th className="font-montserrat font-medium pt-8 pb-2 pl-5 text-left">
                                Start Date
                            </th>
                            <th className="font-montserrat font-medium pt-8 pb-2 pl-5 text-left">
                                End Date
                            </th>
                            <th className="font-montserrat font-medium pt-8 pb-2 pl-5 text-left">
                                Export Raw Data
                            </th>
                            <th className="font-montserrat font-medium pt-8 pb-2 pl-5 text-left">
                                Export Absorbance Data
                            </th>
                            <th className="font-montserrat font-medium pt-8 pb-2 pl-5 text-left">
                                Export Concentration Data
                            </th>
                            <th className="font-montserrat font-medium pt-8 pb-2 pl-5 text-left">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                    {deploymentData.map((deployment, index) => (
                        <tr key={index} className="border border-custom-gray-1">
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                {deployment.deployment}
                            </td>
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                {new Date(deployment.start_time * 1000).toLocaleString()}
                            </td>
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                {new Date(deployment.end_time * 1000).toLocaleString()}
                            </td>
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                <div className="flex space-x-6">
                                    <button className={`text-blue-600 ${exporting ? 'button-disabled text-gray-600' : ''}`} onClick={() => handleExportRawCsvData(deployment.deployment, deployment.start_time, deployment.end_time)} disabled={exporting}>
                                        {exportingRawCsv === deployment.deployment ? <TailSpin height={20} width={20} color="blue" /> : '.csv'}
                                    </button>
                                    <button className={`text-blue-600 ${exporting ? 'button-disabled text-gray-600' : ''}`} onClick={() => handleExportRawData(deployment.deployment, deployment.start_time, deployment.end_time)} disabled={exporting}>
                                        {exportingRawJson === deployment.deployment ? <TailSpin height={20} width={20} color="blue" /> : '.json'}
                                    </button>
                                </div>
                            </td>
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                <div className="flex space-x-6">
                                    <button className={`text-blue-600 ${exporting ? 'button-disabled text-gray-600' : ''}`} onClick={() => handleExportAbsorbanceCsvData(deployment.deployment, deployment.start_time, deployment.end_time)} disabled={exporting}>
                                        {exportingAbsorbanceCsv === deployment.deployment ? <TailSpin height={20} width={20} color="blue" /> : '.csv'}
                                    </button>
                                    <button className={`text-blue-600 ${exporting ? 'button-disabled text-gray-600' : ''}`} onClick={() => handleExportAbsorbanceData(deployment.deployment, deployment.start_time, deployment.end_time)} disabled={exporting}>
                                        {exportingAbsorbanceJson === deployment.deployment ? <TailSpin height={20} width={20} color="blue" /> : '.json'}
                                    </button>
                                </div>
                            </td>
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                <div className="flex space-x-6">
                                    <button className={`text-blue-600 ${exporting ? 'button-disabled text-gray-600' : ''}`} onClick={() => handleExportConcentrationCsvData(deployment.deployment, deployment.start_time, deployment.end_time)} disabled={exporting}>
                                        {exportingConcentrationCsv === deployment.deployment ? <TailSpin height={20} width={20} color="blue" /> : '.csv'}
                                    </button>
                                    <button className={`text-blue-600 ${exporting ? 'button-disabled text-gray-600' : ''}`} onClick={() => handleExportConcentrationData(deployment.deployment, deployment.start_time, deployment.end_time)} disabled={exporting}>
                                        {exportingConcentrationJson === deployment.deployment ? <TailSpin height={20} width={20} color="blue" /> : '.json'}
                                    </button>
                                </div>
                            </td>
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                <div className="flex space-x-2">
                                    <button className={`text-red-700 ${exporting ? 'button-disabled text-gray-600': ''}`} disabled={exporting} onClick={() => confirmDelete === deployment.deployment ? confirmDeleteAction(deployment.deployment) : handleDelete(deployment.deployment)}>
                                        {confirmDelete === deployment.deployment ? 'Sure?' : 'Delete'}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ExportSpec;
