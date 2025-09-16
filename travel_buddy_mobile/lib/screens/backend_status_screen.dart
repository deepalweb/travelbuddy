import 'package:flutter/material.dart';
import '../services/backend_status_service.dart';

class BackendStatusScreen extends StatefulWidget {
  const BackendStatusScreen({super.key});

  @override
  State<BackendStatusScreen> createState() => _BackendStatusScreenState();
}

class _BackendStatusScreenState extends State<BackendStatusScreen> {
  Map<String, dynamic>? _statusData;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _checkStatus();
  }

  Future<void> _checkStatus() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final status = await BackendStatusService.checkBackendStatus();
      setState(() {
        _statusData = status;
      });
    } catch (e) {
      setState(() {
        _statusData = {'error': e.toString()};
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Backend Status'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _checkStatus,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _statusData == null
              ? const Center(child: Text('No data'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildInfoCard(),
                      const SizedBox(height: 16),
                      _buildEndpointsCard(),
                    ],
                  ),
                ),
    );
  }

  Widget _buildInfoCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Backend Information',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _buildInfoRow('Base URL', _statusData!['baseUrl']),
            _buildInfoRow('Checked At', _statusData!['timestamp']),
          ],
        ),
      ),
    );
  }

  Widget _buildEndpointsCard() {
    final endpoints = _statusData!['endpoints'] as Map<String, dynamic>;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'API Endpoints Status',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            ...endpoints.entries.map((entry) => _buildEndpointRow(entry.key, entry.value)),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontFamily: 'monospace'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEndpointRow(String endpoint, Map<String, dynamic> data) {
    final isSuccess = data['status'] == 'SUCCESS';
    final statusCode = data['statusCode'] ?? 0;
    
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isSuccess ? Colors.green[50] : Colors.red[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isSuccess ? Colors.green[200]! : Colors.red[200]!,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isSuccess ? Icons.check_circle : Icons.error,
                color: isSuccess ? Colors.green : Colors.red,
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  endpoint,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: _getStatusColor(statusCode),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  statusCode.toString(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          if (data['error'] != null) ...[
            const SizedBox(height: 8),
            Text(
              'Error: ${data['error']}',
              style: TextStyle(
                color: Colors.red[700],
                fontSize: 12,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Color _getStatusColor(int statusCode) {
    if (statusCode >= 200 && statusCode < 300) return Colors.green;
    if (statusCode >= 400 && statusCode < 500) return Colors.orange;
    if (statusCode >= 500) return Colors.red;
    return Colors.grey;
  }
}