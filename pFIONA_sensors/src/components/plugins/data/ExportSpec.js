import React, { useEffect, useState } from 'react';
import { TailSpin } from 'react-loader-spinner';

function ExportSpec() {
    const [deploymentData, setDeploymentData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportingRaw, setExportingRaw] = useState(null);
    const [exportingAbsorbance, setExportingAbsorbance] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/api/get_deployment_list?sensor_id=2")
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
        setExportingRaw(deploymentId);
        const avgTimestamp = Math.floor((startTime + endTime) / 2);
        const url = `http://127.0.0.1:8000/api/get_spectrums_in_deployment_full_info?sensor_id=2&timestamp=${avgTimestamp}`;

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
                setExportingRaw(null);
            })
            .catch(error => {
                console.error("Error exporting data:", error);
                setExportingRaw(null);
            });
    };

    const handleExportAbsorbanceData = (deploymentId, startTime, endTime) => {
        setExportingAbsorbance(deploymentId);
        const avgTimestamp = Math.floor((startTime + endTime) / 2);
        const url = `http://127.0.0.1:8000/api/get_absorbance_spectrums_in_deployment_full_info?sensor_id=2&timestamp=${avgTimestamp}`;

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
                setExportingAbsorbance(null);
            })
            .catch(error => {
                console.error("Error exporting data:", error);
                setExportingAbsorbance(null);
            });
    };

    const handleDelete = (sensorId, deploymentId) => {
        setConfirmDelete(deploymentId);
        setTimeout(() => {
            setConfirmDelete(null);
        }, 3000);
    };

    const confirmDeleteAction = (sensorId, deploymentId) => {
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
                                    <button className={`text-blue-600 ${exportingRaw !== null || exportingAbsorbance !== null ? 'button-disabled text-gray-600' : ''}`} disabled={exportingRaw !== null || exportingAbsorbance !== null}>.csv</button>
                                    <button className={`text-blue-600 ${exportingRaw !== null || exportingAbsorbance !== null ? 'button-disabled text-gray-600' : ''}`} onClick={() => handleExportRawData(deployment.deployment, deployment.start_time, deployment.end_time)} disabled={exportingRaw !== null || exportingAbsorbance !== null}>
                                        {exportingRaw === deployment.deployment ? <TailSpin height={20} width={20} color="blue" /> : '.json'}
                                    </button>
                                </div>
                            </td>
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                <div className="flex space-x-6">
                                    <button className={`text-blue-600 ${exportingRaw !== null || exportingAbsorbance !== null ? 'button-disabled text-gray-600' : ''}`} disabled={exportingRaw !== null || exportingAbsorbance !== null}>.csv</button>
                                    <button className={`text-blue-600 ${exportingRaw !== null || exportingAbsorbance !== null ? 'button-disabled text-gray-600' : ''}`} onClick={() => handleExportAbsorbanceData(deployment.deployment, deployment.start_time, deployment.end_time)} disabled={exportingRaw !== null || exportingAbsorbance !== null}>
                                        {exportingAbsorbance === deployment.deployment ? <TailSpin height={20} width={20} color="blue" /> : '.json'}
                                    </button>
                                </div>
                            </td>
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                <div className="flex space-x-6">
                                    <button className={`text-blue-600 ${exportingRaw !== null || exportingAbsorbance !== null ? 'button-disabled text-gray-600' : ''}`} disabled={exportingRaw !== null || exportingAbsorbance !== null}>.csv</button>
                                    <button className={`text-blue-600 ${exportingRaw !== null || exportingAbsorbance !== null ? 'button-disabled text-gray-600' : ''}`} disabled={exportingRaw !== null || exportingAbsorbance !== null}>.json</button>
                                </div>
                            </td>
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                <div className="flex space-x-2">
                                    <button className={`text-red-700 ${exportingRaw !== null || exportingAbsorbance !== null ? 'button-disabled text-gray-600': ''}`} disabled={exportingRaw !== null || exportingAbsorbance !== null} onClick={() => confirmDelete === deployment.deployment ? confirmDeleteAction(2, deployment.deployment) : handleDelete(2, deployment.deployment)}>
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
