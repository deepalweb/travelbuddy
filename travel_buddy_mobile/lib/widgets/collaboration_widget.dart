import 'package:flutter/material.dart';

class CollaborationWidget extends StatefulWidget {
  final dynamic tripPlan;
  final VoidCallback? onUpdate;
  
  const CollaborationWidget({
    super.key,
    required this.tripPlan,
    this.onUpdate,
  });

  @override
  State<CollaborationWidget> createState() => _CollaborationWidgetState();
}

class _CollaborationWidgetState extends State<CollaborationWidget> {
  final List<Map<String, dynamic>> _collaborators = [
    {'name': 'You', 'email': 'you@example.com', 'role': 'Owner', 'avatar': '👤'},
  ];
  
  final List<Map<String, dynamic>> _pendingVotes = [
    {'activity': 'Louvre Museum', 'votes': 2, 'total': 3, 'status': 'pending'},
    {'activity': 'Eiffel Tower', 'votes': 3, 'total': 3, 'status': 'approved'},
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildCollaboratorsSection(),
        const SizedBox(height: 16),
        _buildVotingSection(),
        const SizedBox(height: 16),
        _buildExpenseSplitSection(),
      ],
    );
  }

  Widget _buildCollaboratorsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.people, color: Colors.blue[600]),
                const SizedBox(width: 8),
                const Text('Collaborators', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const Spacer(),
                TextButton.icon(
                  onPressed: _inviteCollaborator,
                  icon: const Icon(Icons.person_add, size: 16),
                  label: const Text('Invite'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ..._collaborators.map((collaborator) => _buildCollaboratorTile(collaborator)),
          ],
        ),
      ),
    );
  }

  Widget _buildCollaboratorTile(Map<String, dynamic> collaborator) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: Colors.blue[100],
            child: Text(collaborator['avatar'], style: const TextStyle(fontSize: 12)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(collaborator['name'], style: const TextStyle(fontWeight: FontWeight.w500)),
                Text(collaborator['email'], style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              collaborator['role'],
              style: TextStyle(fontSize: 10, color: Colors.blue[700], fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVotingSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.how_to_vote, color: Colors.green[600]),
                const SizedBox(width: 8),
                const Text('Activity Voting', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
            ..._pendingVotes.map((vote) => _buildVoteTile(vote)),
          ],
        ),
      ),
    );
  }

  Widget _buildVoteTile(Map<String, dynamic> vote) {
    final isApproved = vote['status'] == 'approved';
    final progress = vote['votes'] / vote['total'];
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isApproved ? Colors.green[50] : Colors.orange[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isApproved ? Colors.green[200]! : Colors.orange[200]!,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  vote['activity'],
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isApproved ? Colors.green : Colors.orange,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  isApproved ? 'APPROVED' : 'VOTING',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor: Colors.grey[200],
                  valueColor: AlwaysStoppedAnimation(
                    isApproved ? Colors.green : Colors.orange,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${vote['votes']}/${vote['total']}',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
              ),
            ],
          ),
          if (!isApproved) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _voteActivity(vote, false),
                    icon: const Icon(Icons.thumb_down, size: 16),
                    label: const Text('No'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _voteActivity(vote, true),
                    icon: const Icon(Icons.thumb_up, size: 16),
                    label: const Text('Yes'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildExpenseSplitSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.account_balance_wallet, color: Colors.purple[600]),
                const SizedBox(width: 8),
                const Text('Expense Splitting', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const Spacer(),
                TextButton(
                  onPressed: _showExpenseDetails,
                  child: const Text('View All'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildExpenseItem('Hotel (3 nights)', '€450', 'Split 3 ways', '€150 each'),
            _buildExpenseItem('Louvre Tickets', '€45', 'Split 3 ways', '€15 each'),
            _buildExpenseItem('Dinner at Le Bistro', '€120', 'Split 3 ways', '€40 each'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.purple[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.calculate, color: Colors.purple[600], size: 16),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text('Total per person: €205', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                  TextButton(
                    onPressed: _requestPayment,
                    child: const Text('Request Payment'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExpenseItem(String item, String total, String split, String perPerson) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
                Text(split, style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(total, style: const TextStyle(fontWeight: FontWeight.bold)),
              Text(perPerson, style: TextStyle(fontSize: 11, color: Colors.purple[600])),
            ],
          ),
        ],
      ),
    );
  }

  void _inviteCollaborator() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Invite Collaborator'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              decoration: const InputDecoration(
                labelText: 'Email Address',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(
                labelText: 'Role',
                border: OutlineInputBorder(),
              ),
              items: ['Editor', 'Viewer'].map((role) => 
                DropdownMenuItem(value: role, child: Text(role))
              ).toList(),
              onChanged: (value) {},
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('✉️ Invitation sent!')),
              );
            },
            child: const Text('Send Invite'),
          ),
        ],
      ),
    );
  }

  void _voteActivity(Map<String, dynamic> vote, bool approve) {
    setState(() {
      if (approve) {
        vote['votes']++;
        if (vote['votes'] >= vote['total']) {
          vote['status'] = 'approved';
        }
      }
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(approve ? '👍 Voted Yes!' : '👎 Voted No!'),
        backgroundColor: approve ? Colors.green : Colors.red,
      ),
    );
  }

  void _showExpenseDetails() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Expense Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            const Text('Detailed expense breakdown and payment tracking coming soon!'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        ),
      ),
    );
  }

  void _requestPayment() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('💳 Payment requests sent to all collaborators'),
        backgroundColor: Colors.green,
      ),
    );
  }
}